interface ConnectedMessage {
  type: 'connected';
  message: string;
}

import { Galaxy, Story } from './genproto/types';

type ServerMessage = ConnectedMessage;

// Main application class
class VizApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  //private ws: WebSocket;

  // DOM elements
  private clearBtn: HTMLButtonElement;
  private getGalaxyBtn: HTMLButtonElement;
  private getStoryBtn: HTMLButtonElement;
  private logEl: HTMLElement;
  private advDescEl: HTMLElement;

  // App state
  private galaxy: Galaxy | null = null;
  private story: Story | null = null;

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
    this.getGalaxyBtn = this.getElement<HTMLButtonElement>('get-galaxy-btn');
    this.getStoryBtn = this.getElement<HTMLButtonElement>('get-story-btn');

    // Elements
    this.logEl = this.getElement('log-el');
    this.advDescEl = this.getElement('advDesc-el');

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

  private async handleGetGalaxy(): Promise<void> {
    this.appendLog('Downloading Galaxy...');

    try {
      const galaxy = await this.fetchGalaxy();
      this.galaxy = galaxy;
      this.appendLog(JSON.stringify(galaxy));
    } catch (error) {
      this.appendLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetStory(): Promise<void> {
    this.appendLog('Generating story...');

    try {
      const story = await this.fetchStory();
      this.story = story;
      this.appendLog(JSON.stringify(story));

      this.advDescEl.innerHTML = "<b>" + story.title + ":</b> " + story.story;
    } catch (error) {
      this.appendLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchGalaxy(): Promise<Galaxy> {
    const response = await fetch('http://localhost:8081/api/v1/galaxy', {
      headers: { 'Accept': 'application/x-protobuf' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return Galaxy.decode(new Uint8Array(buffer));
  }

  private async fetchStory(): Promise<Story> {
    const response = await fetch('http://localhost:8083/api/v1/story/new');

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

    this.getGalaxyBtn.addEventListener('click', () => this.handleGetGalaxy());
    this.getStoryBtn.addEventListener('click', () => this.handleGetStory());
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

    this.drawHyperlines();
    this.drawStars();
    this.drawItems();
    this.drawPlaces();
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

  private drawItems() {
    if (!this.galaxy) return;
    if (!this.story) return;
    if (!this.story.initialState) return;

    for (const item of this.story.initialState.items) {
      if (item.starId == null) {
        this.appendLog('Item is missing a star id');
        continue;
      }

      var star_pos = this.galaxy.stars[item.starId].pos;
      if (!star_pos?.x || !star_pos?.y) {
        this.appendLog('Item star is missing position');
        continue;
      }

      this.ctx.beginPath();
      this.ctx.rect(star_pos.x, star_pos.y + 10, 13, 13);
      this.ctx.fillStyle = 'rgb(126, 81, 249)';
      this.ctx.fill();
    }
  }

  private drawPlaces() {
    if (!this.galaxy) return;
    if (!this.story) return;
    if (!this.story.initialState) return;

    for (const item of this.story.initialState.places) {
      if (item.starId == null) {
        this.appendLog('Missing a star id');
        continue;
      }

      var star_pos = this.galaxy.stars[item.starId].pos;
      if (!star_pos?.x || !star_pos?.y) {
        this.appendLog('Star is missing position');
        continue;
      }

      this.ctx.beginPath();
      this.ctx.rect(star_pos.x, star_pos.y + 10, 13, 13);
      this.ctx.fillStyle = 'rgb(255, 14, 239)';
      this.ctx.fill();
    }
  }

  private drawHyperlines() {
    if (!this.galaxy) return;

    for (const hyperline of this.galaxy.hyperlines) {
      if (hyperline.fromId == null || hyperline.toId == null) {
        this.appendLog('Hyperline is missing a target star');
        continue;
      }

      var from_pos = this.galaxy.stars[hyperline.fromId].pos;
      var to_pos = this.galaxy.stars[hyperline.toId].pos;
      if (!from_pos?.x || !to_pos?.x || !from_pos?.y || !to_pos?.y) {
        this.appendLog('Hyperline target star is missing position');
        continue;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(from_pos.x, from_pos.y);
      this.ctx.lineTo(to_pos.x, to_pos.y);
      this.ctx.strokeStyle = 'rgb(20, 229, 83)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawStars() {
    if (!this.galaxy) return;

    for (const star of this.galaxy.stars) {
      if (!star.pos) {
        this.appendLog('Star has no position');
        continue;
      }

      if (!star.pos.x || !star.pos.y) {
        this.appendLog('Star position is missing a coordinate');
        continue;
      }

      this.ctx.beginPath();
      this.ctx.fillStyle = '#ecf315';
      this.ctx.arc(star.pos.x, star.pos.y, 15, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw text
      this.ctx.font = 'bold 18px Arial';
      this.ctx.fillStyle = '#5050f2';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${star.id}`, star.pos.x, star.pos.y + 8);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new VizApp();
});
