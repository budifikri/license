import os from "os";
import * as si from "systeminformation";
import crypto from "crypto";

function bytesToGB(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(2) + " GB";
}

interface DiskInfo {
  index: number;
  name: string;
  type: string;
  size: string;
}

interface DeviceInfo {
  computerId: string;
  hostname: string;
  os: string;
  manufacturer: string;
  model: string;
  biosVersion: string;
  processor: string;
  cpuCores: number;
  ramTotal: string;
  ramFree: string;
  storageTotal: string;
  storageFree: string;
  disks: DiskInfo[];
}

export async function getFullDeviceInfo(): Promise<DeviceInfo> {
  // Computer ID unik - menggunakan UUID atau kombinasi unik dari sistem
  let systemUUID;
  try {
    const systemInfo = await si.system();
    // Gunakan UUID sistem jika tersedia, atau buat hash dari informasi unik
    systemUUID =
      systemInfo.uuid ||
      `${systemInfo.manufacturer}-${systemInfo.model}-${os.hostname()}`;
  } catch {
    systemUUID = `fallback-${Date.now()}`;
  }

  // Buat computerId unik berdasarkan informasi sistem
  const computerId = crypto
    .createHash("sha256")
    .update(systemUUID)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  // Ambil semua info sistem
  const [osInfo, cpu, mem, system, bios, disks, fs] = await Promise.all([
    si.osInfo(),
    si.cpu(),
    si.mem(),
    si.system(),
    si.bios(),
    si.diskLayout(),
    si.fsSize(),
  ]);

  // Ringkasan harddisk
  const diskInfo = disks.map((d, i) => ({
    index: i,
    name: d.name || d.device,
    type: d.type || d.interfaceType,
    size: bytesToGB(d.size),
  }));

  // Total dan free dari filesystem (C:, /, dll.)
  const storageTotal = bytesToGB(fs.reduce((acc, f) => acc + f.size, 0));
  const storageFree = bytesToGB(fs.reduce((acc, f) => acc + f.available, 0));

  return {
    computerId,
    hostname: os.hostname(),
    os: `${osInfo.distro || osInfo.platform} ${osInfo.release} (${
      osInfo.arch
    })`,
    manufacturer: system.manufacturer,
    model: system.model,
    biosVersion: bios.version,
    processor:
      `${cpu.manufacturer} ${cpu.brand} @ ${
        cpu.speed ? `${cpu.speed} GHz` : "N/A"
      }  `.trim() ||
      cpu.vendor ||
      cpu.brand,
    cpuCores: cpu.cores,
    ramTotal: bytesToGB(mem.total),
    ramFree: bytesToGB(mem.free),

    // 🔹 Tambahan Harddisk
    storageTotal,
    storageFree,
    disks: diskInfo,
  };
}
