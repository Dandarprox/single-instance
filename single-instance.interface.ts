export type SingleInstanceEvents = 'second-instance' | 'error';
export type SingleInstanceAdditionalData = Record<any, any>;

export type OnSecondInstanceListener = (
  event: SingleInstanceEvents,
  commandLine: string,
  workingDirectory: string,
  additionalData: SingleInstanceAdditionalData
) => void;
export type OnErrorListener = (error: unknown) => void;

export interface ElectronSingleInstance {
  requestSingleInstanceLock(additionalData?: SingleInstanceAdditionalData): Promise<boolean>;
  releaseSingleInstanceLock(): Promise<boolean>;
}
