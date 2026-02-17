interface ConnectedMessage {
  type: 'connected';
  message: string;
}

import { Star, Galaxy } from './genproto/types';

type ServerMessage = ConnectedMessage;

// Main application class
class VizApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  //private ws: WebSocket;

  // DOM elements
  private clearBtn: HTMLButtonElement;
  private goBtn: HTMLButtonElement;
  private logEl: HTMLElement;

  // App state
  private galaxy: Galaxy | null = null;

  constructor() {
    // Canvas
    this.canvas = this.getElement<HTMLCanvasElement>('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Buttons
    this.clearBtn = this.getElement<HTMLButtonElement>('clear-btn');
    this.goBtn = this.getElement<HTMLButtonElement>('go-btn');

    // Elements
    this.logEl = this.getElement('log-el');

    // Callbacks
    this.setupControls();

    // Connections
    // TODO: Not used yet
    // this.ws = this.connectWebSocket();

    // Render loop
    this.render();
  }

  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element as T;
  }

  private async handleGo(): Promise<void> {
    this.appendLog('Downloading Galaxy...');

    try {
      const galaxy = await this.fetchGalaxy();
      this.galaxy = galaxy;
      this.appendLog(JSON.stringify(galaxy));
    } catch (error) {
      this.appendLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  private async fetchGalaxy(): Promise<Galaxy> {
    const response = await fetch('http://localhost:8081/api/v1/galaxy');

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
  }

  private appendLog(message: string): void {
    this.logEl.innerHTML += new Date().toLocaleString();
    this.logEl.innerHTML += " ";
    this.logEl.innerHTML += message;
    this.logEl.innerHTML += '<br>';
  }

  private setupControls(): void {
    this.clearBtn.addEventListener('click', () => {
      this.appendLog('Canvas cleared');
    });

    this.goBtn.addEventListener('click', () => this.handleGo());
  }

  /*
private connectWebSocket(): WebSocket {
  const ws = new WebSocket(`ws://${window.location.host}`);

  ws.onopen = () => {
    console.log('Connected to server');
    this.appendLog('Connected');
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
    this.appendLog('Disconnected');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event) => {
    this.handleMessage(event.data);
  };

  return ws;
}
  */

  private handleMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data);

      if (message.type === 'connected') {
        console.log(message.message);
      } else if (message.type === 'data') {
      }
    } catch (error) {
      console.error('Unsupported message:', error);
    }
  }

  private drawGalaxy(): void {
    if (!this.galaxy) return;

    this.ctx.fillStyle = '#ecf315';
    for (const star of this.galaxy.stars) {
      if (!star.pos) {
        this.appendLog('Star has no position');
        continue;
      }
      this.ctx.beginPath();
      this.ctx.arc(star.pos.x, star.pos.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private render = (): void => {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw galaxy
    this.drawGalaxy();

    // Continue loop
    requestAnimationFrame(this.render);
  };
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new VizApp();
});
