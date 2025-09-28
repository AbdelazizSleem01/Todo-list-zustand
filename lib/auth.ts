// lib/auth.ts
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import clientPromise from './mongodb';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const client = await clientPromise;
          const db = client.db('todoapp');
          
          // البحث عن المستخدم في قاعدة البيانات
          const user = await db.collection('users').findOne({ 
            email: credentials.email.toLowerCase() 
          });

          if (!user) {
            // إنشاء مستخدم جديد إذا لم يكن موجوداً
            const hashedPassword = await bcrypt.hash(credentials.password, 12);
            const newUser = {
              email: credentials.email.toLowerCase(),
              password: hashedPassword,
              name: credentials.email.split('@')[0],
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const result = await db.collection('users').insertOne(newUser);
            
            return {
              id: result.insertedId.toString(),
              email: newUser.email,
              name: newUser.name
            };
          }

          // التحقق من كلمة المرور للمستخدم الموجود
          const isValidPassword = await bcrypt.compare(
            credentials.password, 
            user.password
          );

          if (!isValidPassword) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name
          };

        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt'
  }
};