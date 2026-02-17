interface ConnectedMessage {
  type: 'connected';
  message: string;
}

type ServerMessage = ConnectedMessage;

// Main application class
class VizApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ws: WebSocket;

  // DOM elements
  private clearBtn: HTMLButtonElement;
  private goBtn: HTMLButtonElement;
  private logEl: HTMLElement;

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
    this.ws = this.connectWebSocket();

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

  private setupControls(): void {
    this.clearBtn.addEventListener('click', () => {
      this.logEl.textContent = 'Canvas cleared';
    });

    this.goBtn.addEventListener('click', () => {
      this.logEl.textContent = 'Go!';
    });
  }

  private connectWebSocket(): WebSocket {
    const ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () => {
      console.log('Connected to server');
      this.logEl.textContent = 'Connected';
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      this.logEl.textContent = 'Disconnected';
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

  private render = (): void => {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw points
    this.ctx.fillStyle = '#ecf315';
    this.ctx.beginPath();
    this.ctx.arc(100, 100, 30, 0, Math.PI * 2);
    this.ctx.fill();

    // Continue loop
    requestAnimationFrame(this.render);
  };
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new VizApp();
});
