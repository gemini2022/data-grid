import { Directive, ElementRef, Renderer2, inject, output } from '@angular/core';

@Directive({
  selector: '[columnResizer]',
  standalone: true
})
export class ColumnResizerDirective {
  // Output
  public mouseDownedEvent = output<boolean>();

  // Private
  private mouseStartPos!: number;
  private resizerStartPos!: number;
  public movedEvent = output<number>();
  private leftColumnStartWidth!: number;
  private removeMouseupListener!: () => void;
  private el: ElementRef = inject(ElementRef);
  private rightColumnsStartPos!: Array<number>;
  private removeMousemoveListener!: () => void;
  private removeMousedownListener!: () => void;
  private rightColumns: Array<HTMLElement> = [];
  private renderer: Renderer2 = inject(Renderer2);



  private ngOnInit(): void {
    this.setMousedownListener();
    this.getRightColumns(this.el.nativeElement.parentElement);
    this.movedEvent.emit(this.getLeftColumnWidth());
  }



  private setMousedownListener(): void {
    this.removeMousedownListener = this.renderer.listen(this.el.nativeElement, 'mousedown', (e: MouseEvent) => {
      this.onMouseDown(e);
    })
  }



  private getRightColumns(column: HTMLElement): void {
    if (column.nextSibling !== null) {
      if (column.nextSibling.firstChild?.nodeType === Node.COMMENT_NODE) {
        this.rightColumns.push((column.nextSibling.childNodes[1] as HTMLElement));
      } else {
        this.rightColumns.push((column.nextSibling.firstChild as HTMLElement));
      }

      this.rightColumns.push((column.nextSibling.lastChild as HTMLElement));
      this.getRightColumns(column.nextSibling as HTMLElement)
    }
  }



  private getLeftColumnWidth(): number {
    return (this.el.nativeElement.offsetLeft - this.el.nativeElement.previousSibling.offsetLeft) + this.el.nativeElement.offsetWidth;
  }



  private onMouseDown(e: MouseEvent): void {
    this.getStartValues(e);
    this.setMouseupListener();
    this.setMousemoveListener();
    this.mouseDownedEvent.emit(true);
  }



  private getStartValues(e: MouseEvent): void {
    this.rightColumnsStartPos = [];
    this.mouseStartPos = e.clientX;

    this.rightColumns.forEach(nextColumn => {
      this.rightColumnsStartPos.push(nextColumn.offsetLeft);
    })

    this.resizerStartPos = this.el.nativeElement.offsetLeft;
    this.leftColumnStartWidth = this.el.nativeElement.previousSibling.offsetWidth;
  }



  private setMouseupListener(): void {
    this.removeMouseupListener = this.renderer.listen('window', 'mouseup', () => {
      this.onMouseUp();
    });
  }



  private setMousemoveListener(): void {
    this.removeMousemoveListener = this.renderer.listen('window', 'mousemove', (e) => {
      this.moveColumns(e);
    });
  }



  private onMouseUp() {
    this.removeMouseupListener();
    this.removeMousemoveListener();
    this.mouseDownedEvent.emit(false);
  }



  private moveColumns(e: MouseEvent) {
    // Move the resizer
    this.renderer.setStyle(this.el.nativeElement, 'left', ((e.clientX - this.mouseStartPos) + this.resizerStartPos) + 'px');

    // Move each column that's to the right of the resizer
    this.rightColumns.forEach((nextColumn, i) => {
      this.renderer.setStyle(nextColumn, 'left', ((e.clientX - this.mouseStartPos) + this.rightColumnsStartPos[i]) + 'px');
    })

    // Resize the width of the column that's to the left of the resizer
    this.renderer.setStyle(this.el.nativeElement.previousSibling, 'width', (this.leftColumnStartWidth - (this.resizerStartPos - this.el.nativeElement.offsetLeft)) + 'px');
    this.setColumnBoundaries();
    this.movedEvent.emit(this.getLeftColumnWidth());
  }



  private setColumnBoundaries() {
    // When the resizer reaches the beginning of the column that's positioned to the left of it
    if (this.el.nativeElement.offsetLeft < (this.el.nativeElement.previousSibling.offsetLeft - this.el.nativeElement.offsetWidth) + 11) {
      // Set the resizer at that position
      this.renderer.setStyle(this.el.nativeElement, 'left', ((this.el.nativeElement.previousSibling.offsetLeft - this.el.nativeElement.offsetWidth) + 11) + 'px');

      // Set the position of each column that's to the right of the resizer accordingly
      this.rightColumns.forEach((nextColumn, i) => {
        this.renderer.setStyle(nextColumn, 'left', ((this.el.nativeElement.previousSibling.offsetLeft - this.el.nativeElement.offsetWidth) + 11) + (this.rightColumnsStartPos[i] - this.resizerStartPos) + 'px');
      })

      // Set the width of the column that's to the left of the resizer to zero
      this.renderer.setStyle(this.el.nativeElement.previousSibling, 'width', 0);
    }
  }



  private ngOnDestroy(): void {
    if (this.removeMousedownListener) this.removeMousedownListener();
  }
}