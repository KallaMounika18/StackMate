import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Paste {
  id: string;
  text: string;
  timestamp: string;
  lines: number;
  language?: string;
}

@Component({
  selector: 'app-share-paste',
  templateUrl: './share-paste.component.html',
  styleUrls: ['./share-paste.component.scss']
})
export class SharePasteComponent implements OnInit {
  snippet: Paste | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      const saved = localStorage.getItem('devnotes_pastes');

      if (id && saved) {
        const pastes: Paste[] = JSON.parse(saved);
        this.snippet = pastes.find(p => p.id === id) || null;
      }
    });
  }
}
