import { Galaxy, Story, StarWeather } from './genproto/types';

interface HasStar {
  starId?: number | undefined;
  name?: string | undefined;
}

// Main application class
class VizApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ws: WebSocket;

  // DOM elements
  private clearBtn: HTMLButtonElement;
  private getGalaxyBtn: HTMLButtonElement;
  private getStoryBtn: HTMLButtonElement;
  private logEl: HTMLElement;
  private advDescEl: HTMLElement;
  private showNamesCheck: HTMLInputElement;
  private loginBtn: HTMLButtonElement;
  private consoleContent: HTMLElement;
  private isMinimized: boolean = false;

  // App state
  private galaxy: Galaxy | null = null;
  private story: Story | null = null;
  private token: string | null = null;

  constructor() {
    // Canvas
    this.canvas = this.getElement<HTMLCanvasElement>('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Controls
    this.clearBtn = this.getElement<HTMLButtonElement>('clear-btn');
    this.getGalaxyBtn = this.getElement<HTMLButtonElement>('get-galaxy-btn');
    this.getStoryBtn = this.getElement<HTMLButtonElement>('get-story-btn');

    // Game options
    this.showNamesCheck = this.getElement<HTMLInputElement>('showNamesCheck');
    this.showNamesCheck.checked = true;

    // Elements
    this.logEl = this.getElement('log-el');
    this.advDescEl = this.getElement('advDesc-el');
    this.logEl = document.getElementById('log-el')!;
    this.consoleContent = document.getElementById('log-content')!;

    // Login
    this.loginBtn = this.getElement<HTMLButtonElement>('loginBtn');

    // Callbacks
    this.setupControls();

    // Connections
    this.ws = this.connectWebSocket();

    // Add control listeners
    document.getElementById('clear-log')?.addEventListener('click', () => {
      this.logEl.innerHTML = '';
    });

    document.getElementById('toggle-console')?.addEventListener('click', () => {
      this.isMinimized = !this.isMinimized;
      this.consoleContent.style.display = this.isMinimized ? 'none' : 'block';
      const toggleBtn = document.getElementById('toggle-console');
      if (toggleBtn) toggleBtn.textContent = this.isMinimized ? '+' : '−';
    });


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
      const story = await this.fetchStory(this.token);
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

  private async fetchStory(token: string | null): Promise<Story> {
    const response = await fetch('https://localhost/api/v1/story/new', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      this.showLoginModal();
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
  }

  private showLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
      modal.style.display = "block";
    }
  }

  private hideLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  private appendLog(message: string): void {
    const timestamp = new Date().toLocaleString();
    this.logEl.innerHTML += `[${timestamp}] ${message}<br>`;

    setTimeout(() => {
      if (this.consoleContent) {
        this.consoleContent.scrollTop = this.consoleContent.scrollHeight;
      }
    }, 10);
  }

  private setupControls(): void {
    this.clearBtn.addEventListener('click', () => {
      this.appendLog('Canvas cleared');
    });

    this.getGalaxyBtn.addEventListener('click', () => this.handleGetGalaxy());
    this.getStoryBtn.addEventListener('click', () => this.handleGetStory());

    this.loginBtn.addEventListener("click", async () => {
      const username = (document.getElementById("username") as HTMLInputElement).value;
      const password = (document.getElementById("password") as HTMLInputElement).value;

      await this.login(username, password);
    });
  }

  private async login(username: string, password: string) {
    const response = await fetch("https://localhost/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      this.appendLog("Login failed");
      this.hideLoginModal();
      return;
    }

    const data = await response.json();
    this.token = data.token;

    this.hideLoginModal();
    this.appendLog("Logged in!");
  }

  private connectWebSocket(): WebSocket {
    const ws = new WebSocket(`ws://localhost:8081/api/v1/ws`);

    ws.onopen = () => {
      console.log('Connected to Galaxy weather websocket');
      this.appendLog('Connected');
    };

    ws.onclose = () => {
      console.log('Disconnected from Galaxy weather websocket');
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

  private handleMessage(data: string): void {
    this.appendLog("Got weather broadcast: " + data);
    const msg = JSON.parse(data) as StarWeather;
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

  private drawLabelledSquares<T extends HasStar>(collection: Iterable<T>, color: string, offset: number) {
    if (!this.galaxy) return;
    if (!this.story) return;
    if (!this.story.initialState) return;

    for (const item of collection) {
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
      this.ctx.rect(star_pos.x, star_pos.y + offset, 13, 13);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${item.name}`, star_pos.x + 16, star_pos.y + offset + 12);

    }
  }

  private drawItems() {
    if (!this.story) return;
    if (!this.story.initialState) return;

    this.drawLabelledSquares(this.story.initialState.items, 'rgb(126, 81, 249)', 10);
  }

  private drawPlaces() {
    if (!this.story) return;
    if (!this.story.initialState) return;

    this.drawLabelledSquares(this.story.initialState.places, 'rgb(255, 14, 239)', 20);
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

      // Draw star id
      this.ctx.font = 'bold 18px Arial';
      this.ctx.fillStyle = '#5050f2';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${star.id}`, star.pos.x, star.pos.y + 8);

      // Draw star name
      if (this.showNamesCheck.checked) {
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${star.name}`, star.pos.x, star.pos.y - 16);
      }
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new VizApp();
});
