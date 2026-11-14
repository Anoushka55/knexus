import { applyScores, detectDups } from "./scoring";
import type { Duplication, Tool } from "./types";

/**
 * Illustrative sample portfolio so the dashboards can be explored without
 * uploading anything. Everything here is made up. It deliberately contains
 * overlapping tools (monitoring, CRM, ITSM, collaboration, APM), end-of-life
 * tools, on-prem tools and low-adoption tools so every dashboard widget has
 * something to show. It runs through the same scoring and overlap detection
 * as a real upload.
 */

type Seed = Omit<Tool, "id" | "scores" | "composite_score" | "rationalization_action" | "confidence_level">;

const SEEDS: Seed[] = [
  // BSS / OSS / core
  { name: "Amdocs Billing", vendor: "Amdocs", category: "BSS", subcategory: "Billing", owner: "Revenue Ops", business_unit: "Finance", annual_cost: 2400000, user_count: 420, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "Critical", integrations: 34, age_years: 9, end_of_life: false, compliance_required: true },
  { name: "Legacy Mediation Engine", vendor: "In-house", category: "BSS", subcategory: "Mediation", owner: "Network Ops", business_unit: "Network", annual_cost: 780000, user_count: 35, license_type: "In-house", deployment: "On-Prem", criticality: "High", integrations: 12, age_years: 16, end_of_life: true, compliance_required: true, pain_points: "Unsupported OS, single maintainer" },
  { name: "Netcracker OSS", vendor: "Netcracker", category: "OSS", subcategory: "Inventory", owner: "Network Ops", business_unit: "Network", annual_cost: 1650000, user_count: 260, license_type: "Subscription", deployment: "Hybrid", criticality: "Critical", integrations: 28, age_years: 6, end_of_life: false, compliance_required: true },
  { name: "Legacy Fault Manager", vendor: "HP", category: "OSS", subcategory: "Fault Management", owner: "Network Ops", business_unit: "Network", annual_cost: 520000, user_count: 40, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "Medium", integrations: 6, age_years: 14, end_of_life: true, compliance_required: false, pain_points: "Vendor ended support in 2023" },

  // CRM
  { name: "Salesforce Sales Cloud", vendor: "Salesforce", category: "CRM", subcategory: "Sales", owner: "Sales Ops", business_unit: "Commercial", annual_cost: 940000, user_count: 1100, license_type: "Subscription", deployment: "Cloud", criticality: "High", integrations: 22, age_years: 5, end_of_life: false, compliance_required: true },
  { name: "HubSpot CRM", vendor: "HubSpot", category: "CRM", subcategory: "Sales", owner: "Marketing", business_unit: "Commercial", annual_cost: 310000, user_count: 240, license_type: "Subscription", deployment: "Cloud", criticality: "Medium", integrations: 8, age_years: 3, end_of_life: false, compliance_required: false },
  { name: "Legacy Siebel CRM", vendor: "Oracle", category: "CRM", subcategory: "Service", owner: "Customer Care", business_unit: "Customer Care", annual_cost: 690000, user_count: 90, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "Medium", integrations: 9, age_years: 15, end_of_life: true, compliance_required: false, pain_points: "Extended support ending, heavy customisation" },

  // ERP
  { name: "SAP S/4HANA", vendor: "SAP", category: "ERP", subcategory: "Finance", owner: "Finance IT", business_unit: "Finance", annual_cost: 3100000, user_count: 900, license_type: "Subscription", deployment: "Cloud", criticality: "Critical", integrations: 41, age_years: 3, end_of_life: false, compliance_required: true },

  // ITSM
  { name: "ServiceNow ITSM", vendor: "ServiceNow", category: "ITSM", subcategory: "Incident", owner: "IT Service Mgmt", business_unit: "IT", annual_cost: 880000, user_count: 1500, license_type: "Subscription", deployment: "Cloud", criticality: "High", integrations: 26, age_years: 5, end_of_life: false, compliance_required: true },
  { name: "BMC Remedy", vendor: "BMC", category: "ITSM", subcategory: "Incident", owner: "IT Service Mgmt", business_unit: "IT", annual_cost: 410000, user_count: 160, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "Medium", integrations: 7, age_years: 12, end_of_life: false, compliance_required: false, pain_points: "Parallel ticketing with ServiceNow" },

  // Monitoring / Logging / APM
  { name: "Splunk Enterprise", vendor: "Splunk", category: "Logging", subcategory: "Log Analytics", owner: "SecOps", business_unit: "IT", annual_cost: 1250000, user_count: 220, license_type: "Subscription", deployment: "Hybrid", criticality: "High", integrations: 30, age_years: 7, end_of_life: false, compliance_required: true },
  { name: "ELK Stack (self-hosted)", vendor: "Elastic", category: "Logging", subcategory: "Log Analytics", owner: "Platform Eng", business_unit: "IT", annual_cost: 280000, user_count: 80, license_type: "Open Source + Support", deployment: "On-Prem", criticality: "Medium", integrations: 11, age_years: 6, end_of_life: false, compliance_required: false },
  { name: "Datadog", vendor: "Datadog", category: "Monitoring", subcategory: "Infrastructure", owner: "Platform Eng", business_unit: "IT", annual_cost: 760000, user_count: 190, license_type: "Subscription", deployment: "Cloud", criticality: "High", integrations: 24, age_years: 3, end_of_life: false, compliance_required: false },
  { name: "Nagios XI", vendor: "Nagios", category: "Monitoring", subcategory: "Infrastructure", owner: "Network Ops", business_unit: "Network", annual_cost: 95000, user_count: 25, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "Low", integrations: 3, age_years: 13, end_of_life: false, compliance_required: false, pain_points: "Duplicates Datadog coverage" },
  { name: "Dynatrace", vendor: "Dynatrace", category: "APM", subcategory: "Application Performance", owner: "Platform Eng", business_unit: "IT", annual_cost: 690000, user_count: 140, license_type: "Subscription", deployment: "Cloud", criticality: "High", integrations: 19, age_years: 4, end_of_life: false, compliance_required: false },
  { name: "New Relic", vendor: "New Relic", category: "APM", subcategory: "Application Performance", owner: "Digital", business_unit: "Digital", annual_cost: 340000, user_count: 60, license_type: "Subscription", deployment: "Cloud", criticality: "Medium", integrations: 9, age_years: 4, end_of_life: false, compliance_required: false },

  // Collaboration
  { name: "Microsoft Teams", vendor: "Microsoft", category: "Collaboration", subcategory: "Messaging", owner: "Workplace IT", business_unit: "IT", annual_cost: 620000, user_count: 6200, license_type: "Subscription", deployment: "Cloud", criticality: "High", integrations: 18, age_years: 4, end_of_life: false, compliance_required: true },
  { name: "Slack", vendor: "Slack", category: "Collaboration", subcategory: "Messaging", owner: "Engineering", business_unit: "IT", annual_cost: 240000, user_count: 900, license_type: "Subscription", deployment: "Cloud", criticality: "Low", integrations: 10, age_years: 5, end_of_life: false, compliance_required: false },
  { name: "Cisco Webex", vendor: "Cisco", category: "Collaboration", subcategory: "Messaging", owner: "Workplace IT", business_unit: "IT", annual_cost: 330000, user_count: 450, license_type: "Subscription", deployment: "Cloud", criticality: "Low", integrations: 5, age_years: 6, end_of_life: false, compliance_required: false, pain_points: "Low adoption since Teams rollout" },

  // Security
  { name: "CrowdStrike Falcon", vendor: "CrowdStrike", category: "Security", subcategory: "Endpoint", owner: "SecOps", business_unit: "Security", annual_cost: 710000, user_count: 6400, license_type: "Subscription", deployment: "Cloud", criticality: "Critical", integrations: 15, age_years: 3, end_of_life: false, compliance_required: true },
  { name: "Legacy Antivirus Suite", vendor: "McAfee", category: "Security", subcategory: "Endpoint", owner: "SecOps", business_unit: "Security", annual_cost: 360000, user_count: 1800, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "Medium", integrations: 4, age_years: 11, end_of_life: true, compliance_required: true, pain_points: "Overlaps CrowdStrike, end of support" },

  // Data / Analytics / Cloud / DevOps / Storage
  { name: "Oracle Exadata", vendor: "Oracle", category: "Database", subcategory: "Data Warehouse", owner: "Data Platform", business_unit: "IT", annual_cost: 1900000, user_count: 120, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "High", integrations: 21, age_years: 8, end_of_life: false, compliance_required: true },
  { name: "Snowflake", vendor: "Snowflake", category: "Analytics", subcategory: "Data Warehouse", owner: "Data Platform", business_unit: "IT", annual_cost: 870000, user_count: 310, license_type: "Consumption", deployment: "Cloud", criticality: "High", integrations: 17, age_years: 3, end_of_life: false, compliance_required: false },
  { name: "Tableau", vendor: "Salesforce", category: "Analytics", subcategory: "BI", owner: "BI Team", business_unit: "Finance", annual_cost: 420000, user_count: 650, license_type: "Subscription", deployment: "Cloud", criticality: "Medium", integrations: 8, age_years: 6, end_of_life: false, compliance_required: false },
  { name: "Power BI", vendor: "Microsoft", category: "Analytics", subcategory: "BI", owner: "BI Team", business_unit: "Finance", annual_cost: 190000, user_count: 820, license_type: "Subscription", deployment: "Cloud", criticality: "Medium", integrations: 7, age_years: 4, end_of_life: false, compliance_required: false },
  { name: "AWS Core Platform", vendor: "AWS", category: "Cloud", subcategory: "IaaS", owner: "Cloud CoE", business_unit: "IT", annual_cost: 3400000, user_count: 480, license_type: "Consumption", deployment: "Cloud", criticality: "Critical", integrations: 38, age_years: 5, end_of_life: false, compliance_required: true },
  { name: "Jenkins (self-hosted)", vendor: "Jenkins", category: "DevOps", subcategory: "CI/CD", owner: "Platform Eng", business_unit: "IT", annual_cost: 120000, user_count: 210, license_type: "Open Source", deployment: "On-Prem", criticality: "Medium", integrations: 14, age_years: 9, end_of_life: false, compliance_required: false },
  { name: "GitHub Enterprise", vendor: "Microsoft", category: "DevOps", subcategory: "CI/CD", owner: "Platform Eng", business_unit: "IT", annual_cost: 360000, user_count: 520, license_type: "Subscription", deployment: "Cloud", criticality: "High", integrations: 16, age_years: 4, end_of_life: false, compliance_required: false },
  { name: "NetApp Filers", vendor: "NetApp", category: "Storage", subcategory: "NAS", owner: "Infra Ops", business_unit: "IT", annual_cost: 540000, user_count: 90, license_type: "Perpetual + Support", deployment: "On-Prem", criticality: "Medium", integrations: 6, age_years: 10, end_of_life: false, compliance_required: false },
];

export interface SamplePortfolio {
  tools: Tool[];
  duplications: Duplication[];
  painPoints: string[];
  detectedBudget: number;
}

/** Builds a fresh scored sample portfolio (new objects on every call). */
export function buildSamplePortfolio(): SamplePortfolio {
  const tools = applyScores(SEEDS.map((s, i) => ({ ...s, id: `sample-${String(i + 1).padStart(2, "0")}` })));
  const duplications = detectDups(tools);
  const painPoints = tools.map((t) => t.pain_points).filter((p): p is string => !!p);
  const total = tools.reduce((a, t) => a + (t.annual_cost || 0), 0);
  return { tools, duplications, painPoints, detectedBudget: Math.round(total * 1.1) };
}
