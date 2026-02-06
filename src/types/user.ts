export interface User {
  id: string;
  email: string;
  displayName: string;
  image?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  label: "home" | "work" | "other";
  postalCode?: string;
  prefecture: string;
  city: string;
  street: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface UserProfile {
  user: User;
  addresses: UserAddress[];
}
