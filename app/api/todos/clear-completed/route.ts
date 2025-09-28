import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST() {
  try {
    const client = await clientPromise
    const db = client.db('todoapp')
    
    const result = await db.collection('todos').deleteMany({ 
      completed: true 
    })
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear completed' }, { status: 500 })
  }
}