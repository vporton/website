export interface OpportunityCommunityInterface {
  id: string;
  name: string;
  ticker: string;
}

export default interface OpportunityInterface {
  id?: string;
  title: string;
  community: OpportunityCommunityInterface;
  description: string;
  payout: string;
  type: OpportunityType;
  experience: OpportunityExpLevel;
  commitment: OpportunityCommitment;
  project: OpportunityProjectType;
  permission: OpportunityPermission;
  author: string;
  timestamp: number;
}

export type OpportunityType = 'Bug' | 'Feature' | 'Improvement' | 'Security' | 'Documentation' | 'Design' | 'Code review' | 'Other';
export type OpportunityExpLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type OpportunityCommitment = 'Hours' | 'Days' | 'Weeks' | 'Months';
export type OpportunityProjectType = 'Traditional' | 'Contest' | 'Cooperative';
export type OpportunityPermission = 'Permission' | 'Permissionless';
export type OpportunityStatus = 'Active' | 'In progress' | 'Finished' | 'Closed';