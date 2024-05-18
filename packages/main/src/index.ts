import {app, dialog, ipcMain} from 'electron';
import './security-restrictions';
import {restoreOrCreateWindow} from '/@/mainWindow';
import {platform} from 'node:process';
import updater from 'electron-updater';
import ExcelService from './service/Excel.service';
import DataManagerService from './service/Data-Manager.service';
import ImageService from './service/Image.service';
import {writeFileSync} from 'node:fs';

/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);

/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

/**
 * @see https://www.electronjs.org/docs/latest/api/app#event-activate-macos Event: 'activate'.
 */
app.on('activate', restoreOrCreateWindow);

/**
 * Create the application window when the background process is ready.
 */

app
  .whenReady()
  .then(async () => {
    await restoreOrCreateWindow();
    updater.autoUpdater.checkForUpdatesAndNotify();
    const dataManagerService = DataManagerService.getInstance();
    ipcMain.handle('openExcel:ByID', async (event, arg) => {
      return await ExcelService.openExelByID(arg);
    });

    ipcMain.handle('record:getAll', async (event, arg) => {
      return await dataManagerService.getAllRecords(arg);
    });

    ipcMain.handle('dataEntry:getAll', async (event, arg) => {
      return await dataManagerService.getAllDataEntries(arg);
    });

    ipcMain.handle('image:getOne', async (event, arg) => {
      return await ImageService.getOne(arg);
    });

    ipcMain.handle('getPointRate:byTimeModel', async (event, arg) => {
      return await dataManagerService.getPointRate(arg);
    });

    ipcMain.handle('iamge:saveToMachine', (event, arg) => {
      dialog
        .showSaveDialog({
          title: 'Select a directory',
          filters: [{name: 'png', extensions: ['png']}],
        })
        .then(async result => {
          if (!result.canceled) {
            const path = result.filePath;
            const entry = await dataManagerService.getEntry(arg);
            if (entry) {
              const {recordId, robotName, position} = entry;
              const image = await ImageService.getOne({recordId, robotName, position});
              if (path && image?.imageBuffer) {
                return writeFileSync(path, image?.imageBuffer);
              }
            }
          }
        })
        .catch(err => {
          console.error('Failed to open directory dialog:', err);
        });
    });

    ipcMain.handle('setting:save', async () => {
      try {
        const result = await dialog.showOpenDialog({
          title: 'Select a folder',
          properties: ['openDirectory'],
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const folderPath = result.filePaths[0];
          const setting = await dataManagerService.updateSetting(folderPath);
          return setting;
        }
      } catch (err) {
        console.error('Failed to open folder dialog:', err);
      }
    });
    ipcMain.handle('setting:get', async () => {
      return await dataManagerService.getSetting();
    });
  })
  .catch(e => console.error('Failed create window:', e));

/**
 * Install Vue.js or any other extension in development mode only.
 * Note: You must install `electron-devtools-installer` manually
 */
// if (import.meta.env.DEV) {
//   app
//     .whenReady()
//     .then(() => import('electron-devtools-installer'))
//     .then(module => {
//       const {default: installExtension, VUEJS3_DEVTOOLS} =
//         // @ts-expect-error Hotfix for https://github.com/cawa-93/vite-electron-builder/issues/915
//         typeof module.default === 'function' ? module : (module.default as typeof module);
//
//       return installExtension(VUEJS3_DEVTOOLS, {
//         loadExtensionOptions: {
//           allowFileAccess: true,
//         },
//       });
//     })
//     .catch(e => console.error('Failed install extension:', e));
// }

/**
 * Check for app updates, install it in background and notify user that new version was installed.
 * No reason run this in non-production build.
 * @see https://www.electron.build/auto-update.html#quick-setup-guide
 *
 * Note: It may throw "ENOENT: no such file app-update.yml"
 * if you compile production app without publishing it to distribution server.
 * Like `npm run compile` does. It's ok 😅
 */
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => {})
    .catch(e => console.error('Failed check and install updates:', e));
}
