import path from 'path';
import { config } from '../config/index.mjs';
import { logger } from '../services/logger.mjs';

async function importRunner(moduleName) {
  const modulePath = path.join(config.paths.automation, moduleName);
  try {
    return await import(`file:///${modulePath.replace(/\\/g, '/')}`);
  } catch (err) {
    throw new Error(`Failed to load runner ${moduleName}: ${err.message}`);
  }
}

export async function runJob(job, updateProgress, addLog) {
  const { type, data, id: jobId } = job;
  const runnerConfig = RUNNER_MAP[type];
  if (!runnerConfig) {
    throw new Error(`Unknown job type: ${type}`);
  }

  const mod = await importRunner(runnerConfig.module);
  const runnerFn = mod[runnerConfig.export];

  if (typeof runnerFn !== 'function') {
    throw new Error(`Runner function ${runnerConfig.export} not found in ${runnerConfig.module}`);
  }

  addLog('info', `Starting ${type} automation`, 'start');
  await updateProgress(5, 'Initializing');

  const result = await runnerFn(data);

  addLog('info', `${type} automation completed`, 'complete');
  await updateProgress(100, 'Complete');

  return result;
}

const RUNNER_MAP = {
  'class-d': { module: 'class-d.mjs', export: 'runClassDAutomation' },
  'class-g': { module: 'class-g.mjs', export: 'runClassGAutomation' },
  'class-r': { module: 'class-r.mjs', export: 'runClassRAutomation' },
  'class-n': { module: 'class-n.mjs', export: 'runClassNAutomation' },
  'student-pass': { module: 'student-pass.mjs', export: 'runStudentPassAutomation' },
  'special-pass': { module: 'special-pass.mjs', export: 'runSpecialPassAutomation' },
  'dependant-pass': { module: 'dependant-pass.mjs', export: 'runDependantPassAutomation' },
  'children-dependants': { module: 'children-dependants.mjs', export: 'runChildrenDependantsAutomation' },
  'citizenship-endorsement': { module: 'citizenship-endorsement.mjs', export: 'runCitizenshipEndorsementAutomation' },
  'dual-citizenship': { module: 'dual-citizenship.mjs', export: 'runDualCitizenshipAutomation' },
  're-entry-pass': { module: 're-entry-pass.mjs', export: 'runReEntryPassAutomation' },
  'foreign-national-certificate': { module: 'foreign-national-certificate.mjs', export: 'runForeignNationalCertificateAutomation' },
  'regularization': { module: 'regularization.mjs', export: 'runRegularizationAutomation' },
  'citizen-registration-f10': { module: 'registration-citizen-form10.mjs', export: 'runRegistrationCitizenForm10Automation' },
  'eta-kenya': { module: 'eta-kenya.mjs', export: 'runEtaKenyaAutomation' },
  'upload-requirements': { module: 'uploadrequirments-permit.mjs', export: 'runUploadRequirementsAutomation' },
  'download-permit': { module: 'download-permit.mjs', export: 'runDownloadPermitAutomation' },
};

export function getSupportedJobTypes() {
  return Object.keys(RUNNER_MAP);
}
