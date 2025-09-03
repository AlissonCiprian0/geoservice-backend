export type UserPayload = {
  id: string;
};

export const isUserPayload = (payload: unknown): payload is UserPayload => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'id' in payload &&
    typeof (payload as UserPayload).id === 'string'
  );
};

export interface RegisterUserDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}
