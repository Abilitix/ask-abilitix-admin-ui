export type AssignableMember = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
};

export type RequestMetadata = {
  requestedBy?: AssignableMember | null;
  requestedAt?: string | null;
  reason?: string | null;
};


