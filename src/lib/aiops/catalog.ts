import type {
  Customer,
  DeviceComponent,
  Domain,
  MetricDefinition,
  MetricId,
  Service,
  ServiceJourney,
  Site,
} from "./types";

/* Technology domains */

export const domains: Domain[] = [
  {
    id: "connectivity",
    name: "Enterprise Connectivity",
    short: "Connectivity",
    description: "SD-WAN, leased lines, smart internet and MPLS/VPN transport",
    colorVar: "var(--navy)",
  },
  {
    id: "cloud",
    name: "Cloud",
    short: "Cloud",
    description: "Managed cloud, cloud connect, backup and disaster recovery",
    colorVar: "var(--blue)",
  },
  {
    id: "communication",
    name: "Communication",
    short: "Communication",
    description: "Smartflo, SIP trunking and enterprise voice",
    colorVar: "var(--teal)",
  },
  {
    id: "infrastructure",
    name: "Managed Infrastructure",
    short: "Infrastructure",
    description: "Managed Wi-Fi, network operations and infrastructure monitoring",
    colorVar: "var(--amber)",
  },
  {
    id: "security",
    name: "Cybersecurity",
    short: "Security",
    description: "Managed firewall, SOC monitoring and endpoint security",
    colorVar: "var(--crimson)",
  },
];

export const domainById = Object.fromEntries(domains.map((d) => [d.id, d])) as Record<
  Domain["id"],
  Domain
>;

/* Service inventory */

export const services: Service[] = [
  {
    id: "SVC-SDWAN",
    name: "SD-WAN",
    domainId: "connectivity",
    journeyId: "JRN-CONN",
    slaTarget: "99.5% availability, loss under 1%",
    criticality: "Critical",
  },
  {
    id: "SVC-ILL",
    name: "Internet Leased Line",
    domainId: "connectivity",
    journeyId: "JRN-CONN",
    slaTarget: "99.9% availability",
    criticality: "Critical",
  },
  {
    id: "SVC-SMARTNET",
    name: "Smart Internet",
    domainId: "connectivity",
    journeyId: "JRN-CONN",
    slaTarget: "99.5% availability",
    criticality: "High",
  },
  {
    id: "SVC-MPLS",
    name: "MPLS / VPN",
    domainId: "connectivity",
    journeyId: "JRN-CONN",
    slaTarget: "99.9% availability, latency under 60ms",
    criticality: "Critical",
  },

  {
    id: "SVC-MCLOUD",
    name: "Managed Cloud",
    domainId: "cloud",
    journeyId: "JRN-CLOUD",
    slaTarget: "99.9% availability, p95 under 800ms",
    criticality: "Critical",
  },
  {
    id: "SVC-CCONN",
    name: "Cloud Connect",
    domainId: "cloud",
    journeyId: "JRN-CLOUD",
    slaTarget: "99.9% availability",
    criticality: "High",
  },
  {
    id: "SVC-BDR",
    name: "Backup / Disaster Recovery",
    domainId: "cloud",
    journeyId: "JRN-CLOUD",
    slaTarget: "RPO 15m, RTO 4h",
    criticality: "High",
  },

  {
    id: "SVC-SFLO",
    name: "Smartflo",
    domainId: "communication",
    journeyId: "JRN-UC",
    slaTarget: "99.9% call completion",
    criticality: "Critical",
  },
  {
    id: "SVC-SIP",
    name: "SIP Trunk",
    domainId: "communication",
    journeyId: "JRN-UC",
    slaTarget: "99.9% availability, MOS above 4.0",
    criticality: "Critical",
  },
  {
    id: "SVC-EVOICE",
    name: "Enterprise Voice",
    domainId: "communication",
    journeyId: "JRN-UC",
    slaTarget: "99.5% availability",
    criticality: "High",
  },

  {
    id: "SVC-MWIFI",
    name: "Managed Wi-Fi",
    domainId: "infrastructure",
    journeyId: "JRN-INFRA",
    slaTarget: "99.5% AP availability",
    criticality: "High",
  },
  {
    id: "SVC-NOC",
    name: "Network Operations",
    domainId: "infrastructure",
    journeyId: "JRN-INFRA",
    slaTarget: "P1 response under 15m",
    criticality: "Critical",
  },
  {
    id: "SVC-IMON",
    name: "Infrastructure Monitoring",
    domainId: "infrastructure",
    journeyId: "JRN-INFRA",
    slaTarget: "99.9% collector uptime",
    criticality: "Standard",
  },

  {
    id: "SVC-MFW",
    name: "Managed Firewall",
    domainId: "security",
    journeyId: "JRN-SEC",
    slaTarget: "99.9% availability, policy sync under 5m",
    criticality: "Critical",
  },
  {
    id: "SVC-SOC",
    name: "SOC Monitoring",
    domainId: "security",
    journeyId: "JRN-SEC",
    slaTarget: "Critical triage under 10m",
    criticality: "Critical",
  },
  {
    id: "SVC-EPS",
    name: "Endpoint Security",
    domainId: "security",
    journeyId: "JRN-SEC",
    slaTarget: "99% agent coverage",
    criticality: "High",
  },
];

export const serviceById = Object.fromEntries(services.map((s) => [s.id, s])) as Record<
  string,
  Service
>;

export const serviceName = (id: string) => serviceById[id]?.name ?? id;

/* Service journeys */

export const journeys: ServiceJourney[] = [
  {
    id: "JRN-CONN",
    name: "Enterprise Connectivity",
    domainId: "connectivity",
    description: "Branch and data-centre transport across SD-WAN, leased line and MPLS",
    serviceIds: ["SVC-SDWAN", "SVC-ILL", "SVC-SMARTNET", "SVC-MPLS"],
    drilldown: [
      "Enterprise Connectivity",
      "SD-WAN",
      "Mumbai-01",
      "WAN-EDGE-MUM-07",
      "Network Telemetry",
      "INC-4417",
      "Primary WAN path degradation",
      "Traffic failover to secondary path",
    ],
  },
  {
    id: "JRN-CLOUD",
    name: "Cloud Service Delivery",
    domainId: "cloud",
    description: "Managed cloud workloads, cloud interconnect and protected data",
    serviceIds: ["SVC-MCLOUD", "SVC-CCONN", "SVC-BDR"],
    drilldown: [
      "Cloud",
      "Managed Cloud",
      "Order Processing Workload",
      "CLD-NODE-PUN-04",
      "Compute Telemetry",
      "Predicted capacity saturation",
      "Scale compute tier and rebalance workload",
    ],
  },
  {
    id: "JRN-UC",
    name: "Unified Communications",
    domainId: "communication",
    description: "Smartflo, SIP trunking and enterprise voice quality",
    serviceIds: ["SVC-SFLO", "SVC-SIP", "SVC-EVOICE"],
    drilldown: [
      "Communication",
      "SIP Trunk",
      "Bengaluru-03",
      "SBC-BLR-02",
      "Voice Quality Telemetry",
      "INC-4419",
      "Media path jitter from upstream transport",
      "Re-home trunk to secondary SBC",
    ],
  },
  {
    id: "JRN-INFRA",
    name: "Managed Infrastructure",
    domainId: "infrastructure",
    description: "Managed Wi-Fi estate, NOC operations and monitoring coverage",
    serviceIds: ["SVC-MWIFI", "SVC-NOC", "SVC-IMON"],
    drilldown: [
      "Managed Infrastructure",
      "Managed Wi-Fi",
      "Pune-02",
      "WLC-PUN-01",
      "Controller Telemetry",
      "INC-4421",
      "AP association backlog on controller",
      "Stagger AP re-association",
    ],
  },
  {
    id: "JRN-SEC",
    name: "Cybersecurity",
    domainId: "security",
    description: "Perimeter, SOC detection and endpoint protection",
    serviceIds: ["SVC-MFW", "SVC-SOC", "SVC-EPS"],
    drilldown: [
      "Security",
      "Managed Firewall",
      "EP-DEL-2291",
      "Security Events",
      "INC-4418",
      "Coordinated authentication anomaly",
      "Isolate endpoint and escalate to SOC",
    ],
  },
];

export const journeyById = Object.fromEntries(journeys.map((j) => [j.id, j])) as Record<
  string,
  ServiceJourney
>;

/* Regions and sites */

export const regions = ["West", "North", "South", "East"] as const;

export const sites: Site[] = [
  {
    id: "Mumbai-01",
    name: "Mumbai-01",
    region: "West",
    city: "Mumbai",
    customerIds: ["Enterprise-A", "Enterprise-C"],
  },
  {
    id: "Mumbai-05",
    name: "Mumbai-05",
    region: "West",
    city: "Mumbai",
    customerIds: ["Enterprise-A"],
  },
  {
    id: "Pune-02",
    name: "Pune-02",
    region: "West",
    city: "Pune",
    customerIds: ["Enterprise-A", "Enterprise-D"],
  },
  {
    id: "Bengaluru-03",
    name: "Bengaluru-03",
    region: "South",
    city: "Bengaluru",
    customerIds: ["Enterprise-B", "Enterprise-E"],
  },
  {
    id: "Delhi-04",
    name: "Delhi-04",
    region: "North",
    city: "New Delhi",
    customerIds: ["Enterprise-C", "Enterprise-F"],
  },
  {
    id: "Hyderabad-06",
    name: "Hyderabad-06",
    region: "South",
    city: "Hyderabad",
    customerIds: ["Enterprise-B"],
  },
  {
    id: "Chennai-07",
    name: "Chennai-07",
    region: "South",
    city: "Chennai",
    customerIds: ["Enterprise-E"],
  },
  {
    id: "Kolkata-08",
    name: "Kolkata-08",
    region: "East",
    city: "Kolkata",
    customerIds: ["Enterprise-F"],
  },
];

export const siteById = Object.fromEntries(sites.map((s) => [s.id, s])) as Record<string, Site>;

/* Customers */

export const customers: Customer[] = [
  {
    id: "Enterprise-A",
    name: "Enterprise-A",
    segment: "BFSI, 240 branches",
    siteIds: ["Mumbai-01", "Mumbai-05", "Pune-02"],
    serviceIds: ["SVC-SDWAN", "SVC-MPLS", "SVC-MCLOUD", "SVC-SFLO", "SVC-MFW"],
    contractedSla: "Platinum 99.9%",
  },
  {
    id: "Enterprise-B",
    name: "Enterprise-B",
    segment: "IT Services, 60 offices",
    siteIds: ["Bengaluru-03", "Hyderabad-06"],
    serviceIds: ["SVC-SDWAN", "SVC-ILL", "SVC-SIP", "SVC-MCLOUD", "SVC-EPS"],
    contractedSla: "Gold 99.5%",
  },
  {
    id: "Enterprise-C",
    name: "Enterprise-C",
    segment: "Manufacturing, 85 plants",
    siteIds: ["Mumbai-01", "Delhi-04"],
    serviceIds: ["SVC-SDWAN", "SVC-MPLS", "SVC-MWIFI", "SVC-MFW", "SVC-SOC"],
    contractedSla: "Platinum 99.9%",
  },
  {
    id: "Enterprise-D",
    name: "Enterprise-D",
    segment: "Retail, 410 stores",
    siteIds: ["Pune-02"],
    serviceIds: ["SVC-SMARTNET", "SVC-MWIFI", "SVC-EVOICE", "SVC-BDR"],
    contractedSla: "Gold 99.5%",
  },
  {
    id: "Enterprise-E",
    name: "Enterprise-E",
    segment: "Healthcare, 30 hospitals",
    siteIds: ["Bengaluru-03", "Chennai-07"],
    serviceIds: ["SVC-ILL", "SVC-SIP", "SVC-MCLOUD", "SVC-EPS", "SVC-BDR"],
    contractedSla: "Platinum 99.9%",
  },
  {
    id: "Enterprise-F",
    name: "Enterprise-F",
    segment: "Logistics, 150 hubs",
    siteIds: ["Delhi-04", "Kolkata-08"],
    serviceIds: ["SVC-SDWAN", "SVC-CCONN", "SVC-SFLO", "SVC-MFW"],
    contractedSla: "Silver 99.0%",
  },
];

export const customerById = Object.fromEntries(customers.map((c) => [c.id, c])) as Record<
  string,
  Customer
>;

/* Devices and network components */

export const devices: DeviceComponent[] = [
  {
    id: "WAN-EDGE-MUM-07",
    name: "WAN-EDGE-MUM-07",
    type: "WAN Edge",
    siteId: "Mumbai-01",
    serviceId: "SVC-SDWAN",
    vendorClass: "Branch edge router, primary path",
  },
  {
    id: "WAN-EDGE-MUM-12",
    name: "WAN-EDGE-MUM-12",
    type: "WAN Edge",
    siteId: "Mumbai-05",
    serviceId: "SVC-SDWAN",
    vendorClass: "Branch edge router, secondary path",
  },
  {
    id: "WAN-EDGE-PUN-03",
    name: "WAN-EDGE-PUN-03",
    type: "WAN Edge",
    siteId: "Pune-02",
    serviceId: "SVC-SDWAN",
    vendorClass: "Branch edge router",
  },
  {
    id: "WAN-EDGE-BLR-05",
    name: "WAN-EDGE-BLR-05",
    type: "WAN Edge",
    siteId: "Bengaluru-03",
    serviceId: "SVC-SDWAN",
    vendorClass: "Branch edge router",
  },
  {
    id: "MPLS-PE-MUM-02",
    name: "MPLS-PE-MUM-02",
    type: "WAN Edge",
    siteId: "Mumbai-01",
    serviceId: "SVC-MPLS",
    vendorClass: "Provider edge",
  },
  {
    id: "CLD-NODE-PUN-04",
    name: "CLD-NODE-PUN-04",
    type: "Compute Node",
    siteId: "Pune-02",
    serviceId: "SVC-MCLOUD",
    vendorClass: "Managed cloud compute node",
  },
  {
    id: "CLD-NODE-PUN-05",
    name: "CLD-NODE-PUN-05",
    type: "Compute Node",
    siteId: "Pune-02",
    serviceId: "SVC-MCLOUD",
    vendorClass: "Managed cloud compute node",
  },
  {
    id: "CLD-NODE-BLR-02",
    name: "CLD-NODE-BLR-02",
    type: "Compute Node",
    siteId: "Bengaluru-03",
    serviceId: "SVC-MCLOUD",
    vendorClass: "Managed cloud compute node",
  },
  {
    id: "SBC-BLR-02",
    name: "SBC-BLR-02",
    type: "SBC",
    siteId: "Bengaluru-03",
    serviceId: "SVC-SIP",
    vendorClass: "Session border controller",
  },
  {
    id: "SBC-MUM-01",
    name: "SBC-MUM-01",
    type: "SBC",
    siteId: "Mumbai-01",
    serviceId: "SVC-SFLO",
    vendorClass: "Session border controller",
  },
  {
    id: "WLC-PUN-01",
    name: "WLC-PUN-01",
    type: "Wireless Controller",
    siteId: "Pune-02",
    serviceId: "SVC-MWIFI",
    vendorClass: "Wireless LAN controller",
  },
  {
    id: "FW-DEL-01",
    name: "FW-DEL-01",
    type: "Firewall",
    siteId: "Delhi-04",
    serviceId: "SVC-MFW",
    vendorClass: "Perimeter firewall cluster",
  },
  {
    id: "FW-MUM-03",
    name: "FW-MUM-03",
    type: "Firewall",
    siteId: "Mumbai-01",
    serviceId: "SVC-MFW",
    vendorClass: "Perimeter firewall cluster",
  },
  {
    id: "EP-DEL-2291",
    name: "EP-DEL-2291",
    type: "Endpoint",
    siteId: "Delhi-04",
    serviceId: "SVC-EPS",
    vendorClass: "Managed workstation",
  },
  {
    id: "EP-DEL-2317",
    name: "EP-DEL-2317",
    type: "Endpoint",
    siteId: "Delhi-04",
    serviceId: "SVC-EPS",
    vendorClass: "Managed workstation",
  },
];

export const deviceById = Object.fromEntries(devices.map((d) => [d.id, d])) as Record<
  string,
  DeviceComponent
>;

/* Metric definitions */

export const metrics: MetricDefinition[] = [
  {
    id: "packet_loss_pct",
    label: "Packet loss",
    unit: "%",
    warn: 1.0,
    critical: 2.5,
    precision: 2,
  },
  { id: "latency_ms", label: "Latency", unit: "ms", warn: 60, critical: 90, precision: 0 },
  { id: "jitter_ms", label: "Jitter", unit: "ms", warn: 12, critical: 25, precision: 1 },
  {
    id: "interface_errors",
    label: "Interface errors",
    unit: "/min",
    warn: 20,
    critical: 60,
    precision: 0,
  },
  {
    id: "wan_utilization_pct",
    label: "WAN utilisation",
    unit: "%",
    warn: 75,
    critical: 90,
    precision: 0,
  },
  { id: "cpu_pct", label: "CPU", unit: "%", warn: 75, critical: 90, precision: 0 },
  { id: "memory_pct", label: "Memory", unit: "%", warn: 80, critical: 92, precision: 0 },
  {
    id: "request_queue",
    label: "Request queue depth",
    unit: "req",
    warn: 120,
    critical: 300,
    precision: 0,
  },
  {
    id: "response_time_ms",
    label: "Application response time",
    unit: "ms",
    warn: 800,
    critical: 1500,
    precision: 0,
  },
  {
    id: "auth_failures",
    label: "Authentication failures",
    unit: "/min",
    warn: 15,
    critical: 40,
    precision: 0,
  },
  {
    id: "firewall_blocks",
    label: "Firewall blocks",
    unit: "/min",
    warn: 60,
    critical: 150,
    precision: 0,
  },
  {
    id: "endpoint_anomalies",
    label: "Endpoint anomalies",
    unit: "/min",
    warn: 3,
    critical: 8,
    precision: 0,
  },
];

export const metricById = Object.fromEntries(metrics.map((m) => [m.id, m])) as Record<
  MetricId,
  MetricDefinition
>;

export const metricLabel = (id: MetricId) => metricById[id]?.label ?? id;
