import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db('todoapp')
    const todo = await db.collection('todos').findOne({ 
      _id: new ObjectId(params.id) 
    })
    
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }
    
    return NextResponse.json(todo)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const client = await clientPromise
    const db = client.db('todoapp')
    
    const result = await db.collection('todos').updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date().toISOString()
        } 
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db('todoapp')
    
    const result = await db.collection('todos').deleteOne({ 
      _id: new ObjectId(params.id) 
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}