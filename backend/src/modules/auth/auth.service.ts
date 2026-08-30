import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { comparePassword, hashPassword } from "../../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { z } from "zod";
import { loginSchema, registerSchema } from "./auth.validation";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

function issueTokens(userId: string) {
  return {
    accessToken: signAccessToken({ sub: userId }),
    refreshToken: signRefreshToken({ sub: userId }),
  };
}

export async function register(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError("E-mail já cadastrado", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({ name: input.name, email: input.email, passwordHash });

  return {
    user: { id: user._id, name: user.name, email: user.email },
    ...issueTokens(user._id.toString()),
  };
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError("Credenciais inválidas", 401);
  }

  return {
    user: { id: user._id, name: user.name, email: user.email },
    ...issueTokens(user._id.toString()),
  };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Refresh token inválido ou expirado");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw AppError.unauthorized("Usuário não encontrado");
  }

  return issueTokens(user._id.toString());
}
