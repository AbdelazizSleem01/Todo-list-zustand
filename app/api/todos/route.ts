// app/api/todos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('todoapp')
    
    const todos = await db.collection('todos')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json(todos)
  } catch (error) {
    console.error('Fetch todos error:', error)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, dueDate, priority } = await request.json()
    
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('todoapp')
    
    const todo = {
      text: text.trim(),
      dueDate,
      priority: priority || 'medium',
      completed: false,
      userId: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const result = await db.collection('todos').insertOne(todo)
    
    return NextResponse.json({ 
      ...todo, 
      _id: result.insertedId 
    })
  } catch (error) {
    console.error('Create todo error:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}