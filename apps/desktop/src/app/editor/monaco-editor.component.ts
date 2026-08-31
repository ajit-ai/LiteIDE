import { Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'qm-monaco',
  template: `<div #container style="width:100%;height:100%"></div>`,
  standalone: true,
})
export class MonacoEditorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() value = '';
  @Input() language = 'plaintext';
  @Input() theme: 'vs' | 'vs-dark' = 'vs-dark';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  ngOnInit() {
    this.editor = monaco.editor.create(this.container.nativeElement, {
      value: this.value,
      language: this.languageFor(this.language),
      theme: this.theme,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      scrollBeyondLastLine: false,
    });
    this.editor.onDidChangeModelContent(() => {
      const val = this.editor?.getValue() ?? '';
      this.valueChange.emit(val);
    });
    this.editor.onDidChangeCursorPosition((e) => {
      (window as unknown as Record<string, unknown>)['__cursor'] = { line: e.position.lineNumber, col: e.position.column };
      window.dispatchEvent(new CustomEvent('cursorChange', { detail: { line: e.position.lineNumber, col: e.position.column } }));
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.editor) {
      if (changes['value'] && changes['value'].currentValue !== this.editor.getValue()) {
        this.editor.setValue(this.value);
      }
      if (changes['language']) {
        const model = this.editor.getModel();
        if (model) monaco.editor.setModelLanguage(model, this.languageFor(this.language));
      }
      if (changes['theme']) {
        monaco.editor.setTheme(this.theme);
      }
    }
  }

  ngOnDestroy() {
    this.editor?.dispose();
  }

  private languageFor(lang: string): string {
    if (lang === 'c') return 'c';
    if (lang === 'cpp' || lang === 'c++') return 'cpp';
    if (lang === 'java') return 'java';
    if (lang === 'python') return 'python';
    if (lang === 'javascript' || lang === 'js') return 'javascript';
    if (lang === 'typescript' || lang === 'ts') return 'typescript';
    return 'plaintext';
  }
}
