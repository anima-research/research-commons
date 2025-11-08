export interface MarginAnnotation {
  id: string
  type: 'selection'  // Unified type
  anchorMessageId: string
  anchorOffset?: number
  priority: number
  minHeight: number
  data: {
    selection: any
    tags: any[]
    comments: any[]
    ratings: any[]
  }
}

export interface LayoutPosition {
  annotationId: string
  idealTop: number
  idealBottom: number    // Where annotation should end
  actualTop: number
  height: number
  priority: number
}

export class AnnotationLayoutManager {
  private messagePositions: Map<string, { top: number, height: number }> = new Map()
  private containerTop: number = 0

  updateMessagePositions(containerEl: HTMLElement | null) {
    if (!containerEl) return
    
    const containerRect = containerEl.getBoundingClientRect()
    this.containerTop = containerRect.top
    this.messagePositions.clear()
    
    const messages = containerEl.querySelectorAll('[data-message-id]')
    
    messages.forEach(el => {
      const messageId = el.getAttribute('data-message-id')
      if (messageId) {
        const rect = el.getBoundingClientRect()
        // Position relative to container's scroll position
        const relativeTop = rect.top - this.containerTop + containerEl.scrollTop
        this.messagePositions.set(messageId, {
          top: relativeTop,
          height: rect.height
        })
      }
    })
  }

  layoutAnnotations(annotations: MarginAnnotation[]): LayoutPosition[] {
    const positions: LayoutPosition[] = []
    
    // Calculate ideal positions
    for (const ann of annotations) {
      const messagePos = this.messagePositions.get(ann.anchorMessageId)
      if (!messagePos) continue
      
      const idealTop = messagePos.top + (ann.anchorOffset || 0)
      const idealBottom = idealTop + messagePos.height
      
      positions.push({
        annotationId: ann.id,
        idealTop,
        idealBottom,
        actualTop: idealTop,
        height: ann.minHeight,
        priority: ann.priority
      })
    }
    
    // Sort by ideal position
    positions.sort((a, b) => a.idealTop - b.idealTop)
    
    // Collision detection and resolution
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1]
      const curr = positions[i]
      
      const prevBottom = prev.actualTop + prev.height + 8 // 8px gap
      
      if (curr.actualTop < prevBottom) {
        // Collision detected - push current down
        curr.actualTop = prevBottom
      }
    }
    
    return positions
  }

  getConnectionPath(pos: LayoutPosition, cardHeight: number): string {
    const displacement = pos.actualTop - pos.idealTop
    
    if (Math.abs(displacement) < 5) {
      // Aligned, no line needed
      return ''
    }
    
    // Create curved path from card to anchor
    const startY = cardHeight / 2
    const endY = startY - displacement
    const dx = 32
    
    return `M 0,${startY} C ${dx/2},${startY} ${dx/2},${endY} ${dx},${endY}`
  }
}

