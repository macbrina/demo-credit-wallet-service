import db from "../../db";
import bcrypt from "bcrypt";

interface UserData {
  user_id?: number;
  name: string;
  email: string;
  password: string;
  phone_number: string;
  created_at?: Date;
  updated_at?: Date;
}

class User {
  user_id?: number;
  name: string;
  email: string;
  password: string;
  phone_number: string;
  created_at?: Date;
  updated_at?: Date;

  constructor({
    user_id,
    name,
    email,
    password,
    phone_number,
    created_at,
    updated_at,
  }: UserData) {
    this.user_id = user_id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.phone_number = phone_number;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async createUser(userData: UserData): Promise<number> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [newUserId] = await db("users").insert({
      ...userData,
      password: hashedPassword,
    });
    return newUserId;
  }

  static async findUserById(id: number): Promise<User | null> {
    const user = await db<UserData>("users").where({ user_id: id }).first();
    return user ? new User(user) : null;
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const user = await db<UserData>("users").where({ email }).first();
    return user ? new User(user) : null;
  }
}

export default User;
