import EventEmitter from "events";
import assert from "assert";
import path from "path";
import os from "os";
import net from "net";
import fs from "fs";
import { ElectronSingleInstance, OnErrorListener, OnSecondInstanceListener, SingleInstanceAdditionalData, SingleInstanceEvents } from "./single-instance.interface";

export class SingleInstance extends EventEmitter implements ElectronSingleInstance {
  private options: { socketPath?: string };
  private socketPath: string;
  private server: net.Server | null = null;
  private additionalData: SingleInstanceAdditionalData = {};

  constructor(appName: string, options?: { socketPath?: string }) {
    super();
    assert(appName, "Missing required parameter 'appName'.");

    const defaultSocketPath = process.platform === 'win32'
      ? '\\\\.\\pipe\\' + appName + '-sock'
      : path.join(os.tmpdir(), appName + '.sock');

    this.options = options || {};
    this.socketPath = this.options.socketPath || defaultSocketPath;
  }

  requestSingleInstanceLock(additionalData: SingleInstanceAdditionalData): Promise<boolean> {
    this.additionalData = additionalData;

    return new Promise<boolean>((resolve) => {
      const client = net.connect({ path: this.socketPath }, () => {
        client.write('connectionAttempt', () => {
          this.emit('second-instance', 'connectionAttempt');
        });
      });

      client.on('error', async () => {
        try {
          fs.unlinkSync(this.socketPath)
        } catch (error) {
          if ((error as { code: string }).code !== 'ENOENT') {
            throw error;
          }
        }

        this.server = net.createServer((connection) => {
          connection.on('data', () => {
            this.emit('second-instance', 'create server');
          });
        });

        resolve(true);
        this.server.listen(this.socketPath);
        this.server.on('error', (error: any) => {
          this.emit('error');
        });
      });
    });
  }

  on(event: 'second-instance', listener: OnSecondInstanceListener): this;
  on(event: 'error', listener: OnErrorListener): this;
  on(
    event: SingleInstanceEvents,
    listener: OnSecondInstanceListener | OnErrorListener): this {
    if (event === 'error') {
      return super.on(event, listener);
    }

    return super.on(event, () => {
      listener(event, process.argv.join(' '), process.cwd(), this.additionalData)
    });
  }

  releaseSingleInstanceLock(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          fs.unlinkSync(this.socketPath);
          resolve(true);
        });

        return;
      }

      resolve(true);
    });
  }
}