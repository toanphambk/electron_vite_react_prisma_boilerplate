import {ipcRenderer} from 'electron';

export const IPCFunction = (message: string) => {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (data: unknown) {
      try {
        // First, you can use the original method to process data if needed
        const processedData = originalMethod.call(this, data);

        // Then, send processed data via IPC
        return await ipcRenderer.invoke(message, processedData);
      } catch (error) {
        console.error(error); // Handle errors more gracefully or log them
      }
    };
  };
};
