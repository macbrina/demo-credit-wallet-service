import bcrypt from "bcrypt";
import { Knex } from "knex";
import db from "../../db";

interface UserData {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone_number: string;
  created_at?: Date;
  updated_at?: Date;
}

class User {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone_number: string;
  created_at?: Date;
  updated_at?: Date;

  constructor({
    id,
    name,
    email,
    password,
    phone_number,
    created_at,
    updated_at,
  }: UserData) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.phone_number = phone_number;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async createUser(
    userData: UserData,
    trx: Knex.Transaction
  ): Promise<number> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [newUserId] = await trx("users").insert({
      ...userData,
      password: hashedPassword,
    });

    const user = await trx("users").select("id").where("id", newUserId).first();
    return user.id;
  }

  static async findUserById(id: number): Promise<User | null> {
    const user = await db<UserData>("users").where({ id }).first();
    return user ? new User(user) : null;
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const user = await db<UserData>("users").where({ email }).first();
    return user ? new User(user) : null;
  }
}

export default User;
