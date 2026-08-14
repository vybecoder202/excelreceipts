export type ProjectAccess = {
  id: string;
  name: string;
  reference: string;
  status: string;
  currencyCode: string;
  timezone: string;
  role: string;
};

export type ApplicationAccessContext =
  | {
      mode: "foundation";
      user: null;
      project: null;
      canCreateProject: false;
    }
  | {
      mode: "configured";
      user: null;
      project: null;
      canCreateProject: false;
    }
  | {
      mode: "authenticated";
      user: {
        id: string;
        email: string;
        displayName: string;
      };
      project: ProjectAccess | null;
      canCreateProject: boolean;
    };
