import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export async function exportToFile(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);

  if (isNative) {
    // Write file to cache directory first
    const cacheDir = Directory.Cache;
    const filePath = `${cacheDir}/${filename}`;

    try {
      // Write JSON to cache
      await Filesystem.writeFile({
        path: filePath,
        data: jsonStr,
        directory: cacheDir,
        encoding: Encoding.UTF8,
      });

      // Get the URI for sharing
      const fileUri = await Filesystem.getUri({
        path: filePath,
        directory: cacheDir,
      });

      // Share the file
      await Share.share({
        title: filename,
        text: 'Ollama GUI Chat Export',
        url: fileUri.uri,
        dialogTitle: 'Share Chat Export',
      });

      return { success: true, path: fileUri.uri, shared: true };
    } catch (err) {
      console.error('Export failed:', err);
      throw new Error('Failed to export: ' + (err.message || 'Unknown error'));
    }
  } else {
    // Browser fallback
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, path: null };
  }
}

export async function readFileFromPicker(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
