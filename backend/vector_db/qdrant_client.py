"""
Vector database client for Kenya Invest research storage.
Stores embeddings of research findings so we don't re-query
Perplexity every time. Research is auto-expired based on TTL.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    SearchRequest, ScoredPoint
)
import openai

class KenyaInvestVectorDB:
    
    def __init__(self):
        # Use in-memory Qdrant for local development (no Docker needed)
        # For production with Docker, set QDRANT_MODE=server in .env
        qdrant_mode = os.getenv('QDRANT_MODE', 'memory')
        
        if qdrant_mode == 'memory':
            self.client = QdrantClient(":memory:")
            print("[Qdrant] Running in-memory mode (no Docker required)")
        else:
            self.client = QdrantClient(
                host=os.getenv('QDRANT_HOST', 'localhost'),
                port=int(os.getenv('QDRANT_PORT', 6333))
            )
        self.embedding_client = openai.OpenAI(
            api_key=os.getenv('EMBEDDING_API_KEY')
        )
        self.embedding_model = os.getenv('EMBEDDING_MODEL', 'text-embedding-3-small')
        self.dimensions = int(os.getenv('EMBEDDING_DIMENSIONS', 1536))
        
        # TTL in seconds per collection
        self.ttl = {
            'fee_schedules':  int(os.getenv('CACHE_TTL_FEES',        604800)),
            'sla_benchmarks': int(os.getenv('CACHE_TTL_SLAS',       1209600)),
            'regulations':    int(os.getenv('CACHE_TTL_REGULATIONS', 2592000)),
            'risk_scores':    int(os.getenv('CACHE_TTL_RISKS',       604800)),
        }
        
        self._init_collections()
    
    def _init_collections(self):
        """Create collections if they don't exist."""
        existing = [c.name for c in self.client.get_collections().collections]
        
        collections = [
            os.getenv('QDRANT_COLLECTION_FEES',  'fee_schedules'),
            os.getenv('QDRANT_COLLECTION_SLAS',  'sla_benchmarks'),
            os.getenv('QDRANT_COLLECTION_REGS',  'regulations'),
            os.getenv('QDRANT_COLLECTION_RISKS', 'risk_scores'),
        ]
        
        for coll in collections:
            if coll not in existing:
                self.client.create_collection(
                    collection_name=coll,
                    vectors_config=VectorParams(
                        size=self.dimensions,
                        distance=Distance.COSINE
                    )
                )
                print(f"Created collection: {coll}")
    
    def _embed(self, text: str) -> List[float]:
        """Convert text to embedding vector."""
        response = self.embedding_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding
    
    def _cache_key(self, sector: str, county: str, 
                   nationality: str, data_type: str) -> str:
        """Generate deterministic cache key."""
        raw = f"{sector}:{county}:{nationality}:{data_type}".lower()
        return hashlib.md5(raw.encode()).hexdigest()
    
    def _is_stale(self, stored_at: str, collection: str) -> bool:
        """Check if cached data has exceeded its TTL."""
        stored = datetime.fromisoformat(stored_at)
        ttl_seconds = self.ttl.get(collection, 604800)
        return datetime.now() > stored + timedelta(seconds=ttl_seconds)
    
    def search(self, query: str, collection: str, 
               sector: str, county: str, nationality: str,
               top_k: int = 5) -> Optional[List[Dict]]:
        """
        Search for cached research results.
        Returns None if no relevant cache exists or if data is stale.
        """
        try:
            query_vector = self._embed(query)
            
            results = self.client.query_points(
                collection_name=collection,
                query=query_vector,
                limit=top_k,
                score_threshold=0.75,
            ).points
        except Exception as e:
            print(f"[VectorDB] Search error: {e}")
            return None
        
        if not results:
            return None
        
        # Filter for matching sector/county/nationality
        valid = []
        for r in results:
            payload = r.payload or {}
            
            # Check metadata matches
            if (payload.get('sector', '').lower() == sector.lower() or
                payload.get('sector') == 'global'):
                
                # Check staleness
                stored_at = payload.get('stored_at', '')
                if stored_at and self._is_stale(stored_at, collection):
                    continue  # Skip stale entries
                
                valid.append({
                    'score': r.score,
                    'data': payload.get('data'),
                    'stored_at': stored_at,
                    'source': payload.get('source', 'cache')
                })
        
        return valid if valid else None
    
    def store(self, content: str, data: Dict, collection: str,
              sector: str, county: str, nationality: str,
              source: str = 'perplexity') -> str:
        """
        Embed and store research result.
        Returns the point ID.
        """
        point_id = self._cache_key(sector, county, nationality, collection)
        vector = self._embed(content)
        
        # Convert hex id to integer for Qdrant
        point_id_int = int(point_id[:8], 16)
        
        self.client.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=point_id_int,
                    vector=vector,
                    payload={
                        'sector': sector,
                        'county': county,
                        'nationality': nationality,
                        'data': data,
                        'raw_content': content[:2000],  # Store first 2K chars
                        'source': source,
                        'stored_at': datetime.now().isoformat(),
                        'cache_key': point_id
                    }
                )
            ]
        )
        
        return point_id
    
    def invalidate(self, sector: str, county: str, 
                   nationality: str, collection: str):
        """Force-expire a cache entry (e.g., after gazette update)."""
        point_id = self._cache_key(sector, county, nationality, collection)
        point_id_int = int(point_id[:8], 16)
        
        try:
            self.client.delete(
                collection_name=collection,
                points_selector=[point_id_int]
            )
        except:
            pass  # OK if doesn't exist
    
    def get_cache_stats(self) -> Dict:
        """Return stats on cache coverage and freshness."""
        stats = {}
        collections = ['fee_schedules', 'sla_benchmarks', 'regulations', 'risk_scores']
        
        for coll in collections:
            try:
                info = self.client.get_collection(coll)
                stats[coll] = {
                    'total_points': info.points_count,
                    'ttl_days': self.ttl[coll] / 86400
                }
            except:
                stats[coll] = {'total_points': 0}
        
        return stats

# Singleton instance
vector_db = KenyaInvestVectorDB()
