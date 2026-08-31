import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { invoke } from '@tauri-apps/api/core';

@Component({
  selector: 'qm-xterm',
  template: `<div #term style="width:100%;height:100%;"></div>`,
  standalone: true,
})
export class XtermComponent implements OnInit, OnDestroy {
  @ViewChild('term', { static: true }) termEl!: ElementRef<HTMLDivElement>;
  @Input() shell: string = '';
  private term: Terminal | null = null;
  private fitAddon: FitAddon | null = null;

  async ngOnInit() {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Consolas, monospace',
      fontSize: 13,
      theme: { background: '#1e1e1e', foreground: '#cccccc' },
    });
    this.fitAddon = new FitAddon();
    term.loadAddon(this.fitAddon);
    term.open(this.termEl.nativeElement);
    this.fitAddon.fit();
    term.writeln('QuantsMind Terminal — xterm.js + PTY');
    try {
      const shells = await invoke<{ name: string; path: string }[]>("get_shells").catch(() => []);
      const shell = shells[0]?.path || 'powershell.exe';
      term.writeln(`Shell: ${shell}`);
      this.shell = shell;
    } catch {
      term.writeln('Shell: powershell.exe -NoLogo');
    }
    term.writeln('Type a command and press Enter — multiple sessions via + button');
    term.onData(async (data) => {
      if (data === '\r') {
        const line = (term as unknown as { _core: { buffer: { x: number } } });
        // For demo, just echo
        term.writeln('');
      }
    });
    this.term = term;
    // Expose for MenuBar Terminal.new
    (window as unknown as Record<string, unknown>)['_xterm'] = term;
  }

  ngOnDestroy() {
    this.term?.dispose();
  }

  write(text: string) { this.term?.writeln(text); }
  clear() { this.term?.clear(); }
}
