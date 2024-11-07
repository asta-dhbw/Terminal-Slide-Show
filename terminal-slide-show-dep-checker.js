

import { exec } from 'child_process';
import { Logger } from './logger.js';
import { config } from './config/config.js';


export class DependencyChecker {
  constructor() {
    this.logger = new Logger('DependencyChecker');
  }


  async checkFramebufferDependencies() {
    if (!config.framebuffer?.enabled) return true;


    const dependencies = [
      { name: config.framebuffer.dependencies.image, purpose: 'image display' },
      { name: config.framebuffer.dependencies.video, purpose: 'video playback' }
    ];


    let missingDeps = [];


    for (const dep of dependencies) {
      try {
        await this.checkCommand(dep.name);
      } catch (error) {
        missingDeps.push(dep);
      }
    }


    if (missingDeps.length > 0) {
      const missing = missingDeps.map(d => `${d.name} (${d.purpose})`).join(', ');
      this.logger.error(`Missing required packages: ${missing}`);


      // Generate installation command
      const installCmd = this.getInstallCommand(missingDeps.map(d => d.name));
      this.logger.info(`Install missing packages with: ${installCmd}`);


      // Print the missing dependencies and install command
      console.log(`Missing required packages: ${missing}`);
      console.log(`Install missing packages with: ${installCmd}`);


      return false;
    }
    return true;
  }


  async checkCommand(command) {
    return new Promise((resolve, reject) => {
      exec(`which ${command}`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }


  getInstallCommand(packages) {
    // Detect package manager
    const packageManagers = {
      'yay': 'yay -S --noconfirm',
      'apt-get': 'sudo apt-get install -y',
      'yum': 'sudo yum install -y',
      'dnf': 'sudo dnf install -y',
      'pacman': 'sudo pacman -S --noconfirm'
    };


    for (const [pm, cmd] of Object.entries(packageManagers)) {
      try {
        if (require('fs').existsSync(`/usr/bin/${pm}`)) {
          return `${cmd} ${packages.join(' ')}`;
        }
      } catch (error) {
        continue;
      }
    }


    return `Please install the following packages using your system's package manager: ${packages.join(' ')}`;
  }
}


// Usage
const checker = new DependencyChecker();
checker.checkFramebufferDependencies().then((result) => {
  if (result) {
    console.log('All framebuffer dependencies are met');
  } else {
    console.log('Framebuffer dependencies are missing');
  }
});