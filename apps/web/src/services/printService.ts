declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      ping: () => Promise<string>;
      silentPrint: (options?: { deviceName?: string; silent?: boolean }) => Promise<{ success: boolean; failureReason?: string }>;
      getPrinters: () => Promise<any[]>;
    };
  }
}

export interface PrintOptions {
  title?: string;
  silent?: boolean;
  deviceName?: string;
}

export const printService = {
  isDesktopSilentPrintingSupported(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI?.silentPrint;
  },

  async getAvailablePrinters(): Promise<any[]> {
    if (this.isDesktopSilentPrintingSupported()) {
      try {
        return (await window.electronAPI?.getPrinters()) || [];
      } catch {
        return [];
      }
    }
    return [];
  },

  async printReceiptOrCard(options: PrintOptions = {}): Promise<{ success: boolean; mode: 'silent' | 'browser' }> {
    // If running in Desktop / Electron shell with silent printing enabled
    if (this.isDesktopSilentPrintingSupported() && options.silent !== false) {
      try {
        const res = await window.electronAPI!.silentPrint({
          deviceName: options.deviceName,
          silent: true,
        });
        if (res.success) {
          return { success: true, mode: 'silent' };
        }
      } catch (err) {
        console.warn('Silent print via Electron failed, falling back to standard dialog:', err);
      }
    }

    // Standard Browser Print Fallback
    if (typeof window !== 'undefined') {
      window.print();
      return { success: true, mode: 'browser' };
    }

    return { success: false, mode: 'browser' };
  },
};
