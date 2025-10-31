import jwt from "jsonwebtoken";

export const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "30d",
  });
};

export default generateToken;
