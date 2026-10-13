import os
import subprocess
import re
import socket
import logging
from typing import List, Dict

logger = logging.getLogger("smartshield.discovery.scanner")

def detect_active_subnet() -> str:
    """
    Detects the current active local IP and returns the corresponding /24 subnet.
    Defaults to 192.168.43.0/24 if detection fails.
    """
    env_net = os.getenv("DISCOVERY_NETWORK")
    if env_net:
        return env_net

    try:
        # Use socket to get the outbound local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        parts = local_ip.split(".")
        if len(parts) == 4 and parts[0] != "127":
            return f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"
    except Exception:
        pass

    return "192.168.43.0/24"

def scan_network(network_range: str = None) -> List[Dict[str, str]]:
    """
    Performs authorized network discovery scan on configured or active subnet.
    Uses nmap -sn and ARP table inspection (/proc/net/arp).
    Returns list of normalized dicts: [{'ip': '...', 'mac': '...', 'hostname': '...'}]
    """
    target_net = network_range or detect_active_subnet()
    discovered_devices: Dict[str, Dict[str, str]] = {}

    # Method 1: Nmap ping scan if installed
    try:
        cmd = ["nmap", "-sn", target_net]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        if result.returncode == 0:
            current_ip = None
            current_hostname = None

            for line in result.stdout.splitlines():
                ip_match = re.search(r"Nmap scan report for (?:([^\s()]+)\s+\()?([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\)?", line)
                if ip_match:
                    current_hostname = ip_match.group(1) or None
                    current_ip = ip_match.group(2)
                    continue

                mac_match = re.search(r"MAC Address:\s+([0-9A-Fa-f:]{17})", line)
                if mac_match and current_ip:
                    mac = mac_match.group(1).upper()
                    discovered_devices[mac] = {
                        "ip": current_ip,
                        "mac": mac,
                        "hostname": current_hostname or get_hostname_quiet(current_ip) or "Unknown Host"
                    }
                    current_ip = None
                    current_hostname = None
    except Exception as e:
        logger.warning(f"[DISCOVERY SCANNER] Nmap scan error or timeout: {e}")

    # Method 2: ARP table fallback (/proc/net/arp)
    try:
        if os.path.exists("/proc/net/arp"):
            with open("/proc/net/arp", "r") as f:
                for line in f.readlines()[1:]: # Skip header
                    parts = line.split()
                    if len(parts) >= 6:
                        ip = parts[0]
                        flags = parts[2]
                        mac = parts[3].upper()
                        # Only include valid resolved MAC addresses (0x2 = complete)
                        if flags != "0x0" and mac != "00:00:00:00:00:00" and re.match(r"^([0-9A-F]{2}:){5}[0-9A-F]{2}$", mac):
                            if mac not in discovered_devices:
                                discovered_devices[mac] = {
                                    "ip": ip,
                                    "mac": mac,
                                    "hostname": get_hostname_quiet(ip) or "Unknown Host"
                                }
    except Exception as e:
        logger.warning(f"[DISCOVERY SCANNER] ARP table fallback error: {e}")

    return list(discovered_devices.values())

def get_hostname_quiet(ip: str) -> str:
    try:
        return socket.gethostbyaddr(ip)[0]
    except Exception:
        return ""
