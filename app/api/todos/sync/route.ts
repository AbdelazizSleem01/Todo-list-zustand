import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lastSync, todos: clientTodos } = await request.json()
    const client = await clientPromise
    const db = client.db('todoapp')

    const serverTodos = await db.collection('todos')
      .find({ userId: session.user.id })
      .toArray()

    if (!lastSync || lastSync < Date.now() - 30000) {
      return NextResponse.json({ todos: serverTodos })
    }

    const clientUpdates = clientTodos.filter((todo: any) => 
      new Date(todo.updatedAt).getTime() > lastSync
    )

    for (const todo of clientUpdates) {
      if (todo._id) {
        await db.collection('todos').updateOne(
          { _id: new ObjectId(todo._id), userId: session.user.id },
          { 
            $set: { 
              ...todo,
              updatedAt: new Date().toISOString()
            } 
          }
        )
      } else {
        await db.collection('todos').insertOne({
          ...todo,
          userId: session.user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }

    const updatedTodos = await db.collection('todos')
      .find({ userId: session.user.id })
      .toArray()

    return NextResponse.json({ todos: updatedTodos })
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}