import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Cmd { id: string; title: string; category: string; }

@Component({
  selector: 'qm-palette',
  standalone: true,
  template: `
    @if (open) {
      <div class="overlay" (click)="close.emit()">
        <div class="palette" (click)="$event.stopPropagation()">
          <input placeholder="Type a command..." [value]="query" (input)="query=$any($event.target).value" />
          <div class="list">
            @for (c of filtered(); track c.id) {
              <div class="item" (click)="run(c)">{{c.category}}: {{c.title}} <small>{{c.id}}</small></div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;justify-content:center;padding-top:12vh;z-index:1000}
    .palette{background:#252526;border:1px solid #3c3c3c;width:560px;max-height:400px;border-radius:6px;display:flex;flex-direction:column}
    input{padding:12px;background:transparent;border:none;border-bottom:1px solid #3c3c3c;color:#ccc;outline:none}
    .list{overflow:auto;flex:1}
    .item{padding:8px 12px;cursor:pointer}
    .item:hover{background:#007acc;color:#fff}
  `]
})
export class CommandPaletteComponent {
  @Input() open = false;
  @Input() commands: Cmd[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() execute = new EventEmitter<string>();
  query = '';
  filtered() {
    if (!this.query) return this.commands;
    const q = this.query.toLowerCase();
    return this.commands.filter(c => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }
  run(c: Cmd) { this.execute.emit(c.id); this.close.emit(); }
}
