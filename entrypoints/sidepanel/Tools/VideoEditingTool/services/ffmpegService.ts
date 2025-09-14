import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private isLoading = false;

  async initialize(): Promise<void> {
    if (this.isLoaded || this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      this.ffmpeg = new FFmpeg();
      
      // Load FFmpeg with WebAssembly
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async cutVideo(
    inputFile: File | Blob,
    startTime: number,
    duration: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    // Set up progress monitoring
    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    try {
      // Write input file
      await this.ffmpeg.writeFile(inputName, await fetchFile(inputFile));

      // Execute cut command
      await this.ffmpeg.exec([
        '-i', inputName,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c', 'copy',
        outputName
      ]);

      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      
      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Video cutting failed:', error);
      throw error;
    }
  }

  async changeSpeed(
    inputFile: File | Blob,
    speed: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(inputFile));

      // Calculate video and audio filters for speed change
      const videoFilter = `setpts=${1/speed}*PTS`;
      const audioFilter = `atempo=${speed}`;

      await this.ffmpeg.exec([
        '-i', inputName,
        '-filter:v', videoFilter,
        '-filter:a', audioFilter,
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Speed change failed:', error);
      throw error;
    }
  }

  async mergeVideos(
    videoFiles: (File | Blob)[],
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    try {
      const inputNames: string[] = [];
      const concatList: string[] = [];

      // Write all input files
      for (let i = 0; i < videoFiles.length; i++) {
        const inputName = `input${i}.mp4`;
        inputNames.push(inputName);
        concatList.push(`file '${inputName}'`);
        await this.ffmpeg.writeFile(inputName, await fetchFile(videoFiles[i]));
      }

      // Create concat list file
      const listContent = concatList.join('\n');
      await this.ffmpeg.writeFile('list.txt', listContent);

      const outputName = 'output.mp4';

      // Execute merge command
      await this.ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      // Clean up
      for (const inputName of inputNames) {
        await this.ffmpeg.deleteFile(inputName);
      }
      await this.ffmpeg.deleteFile('list.txt');
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Video merging failed:', error);
      throw error;
    }
  }

  async addAudioToVideo(
    videoFile: File | Blob,
    audioFile: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const videoName = 'video.mp4';
    const audioName = 'audio.mp3';
    const outputName = 'output.mp4';

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    try {
      await this.ffmpeg.writeFile(videoName, await fetchFile(videoFile));
      await this.ffmpeg.writeFile(audioName, await fetchFile(audioFile));

      await this.ffmpeg.exec([
        '-i', videoName,
        '-i', audioName,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-map', '0:v:0',
        '-map', '1:a:0',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(videoName);
      await this.ffmpeg.deleteFile(audioName);
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Adding audio to video failed:', error);
      throw error;
    }
  }

  async addImageOverlay(
    videoFile: File | Blob,
    imageFile: File | Blob,
    x: number,
    y: number,
    startTime: number,
    duration: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const videoName = 'video.mp4';
    const imageName = 'image.png';
    const outputName = 'output.mp4';

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    try {
      await this.ffmpeg.writeFile(videoName, await fetchFile(videoFile));
      await this.ffmpeg.writeFile(imageName, await fetchFile(imageFile));

      const overlayFilter = `[0:v][1:v]overlay=${x}:${y}:enable='between(t,${startTime},${startTime + duration})'`;

      await this.ffmpeg.exec([
        '-i', videoName,
        '-i', imageName,
        '-filter_complex', overlayFilter,
        '-c:a', 'copy',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(videoName);
      await this.ffmpeg.deleteFile(imageName);
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Adding image overlay failed:', error);
      throw error;
    }
  }

  async addTextOverlay(
    videoFile: File | Blob,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: string,
    fontFamily: string,
    startTime: number,
    duration: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Convert color from hex to FFmpeg format
      const ffmpegColor = color.replace('#', '0x');

      const textFilter = `drawtext=text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${ffmpegColor}:enable='between(t,${startTime},${startTime + duration})'`;

      await this.ffmpeg.exec([
        '-i', inputName,
        '-vf', textFilter,
        '-c:a', 'copy',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Adding text overlay failed:', error);
      throw error;
    }
  }

  async extractFrame(
    videoFile: File | Blob,
    timeInSeconds: number
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const inputName = 'input.mp4';
    const outputName = 'frame.png';

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      await this.ffmpeg.exec([
        '-i', inputName,
        '-ss', timeInSeconds.toString(),
        '-vframes', '1',
        '-f', 'image2',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: 'image/png' });
    } catch (error) {
      console.error('Frame extraction failed:', error);
      throw error;
    }
  }

  async getVideoInfo(videoFile: File | Blob): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
  }> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const inputName = 'input.mp4';

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Use ffprobe-like functionality to get video info
      let output = '';
      this.ffmpeg.on('log', ({ message }) => {
        output += message + '\n';
      });

      await this.ffmpeg.exec([
        '-i', inputName,
        '-f', 'null',
        '-'
      ]);

      await this.ffmpeg.deleteFile(inputName);

      // Parse output to extract video information
      const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      const dimensionsMatch = output.match(/(\d+)x(\d+)/);
      const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);

      const duration = durationMatch 
        ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
        : 0;
      
      const width = dimensionsMatch ? parseInt(dimensionsMatch[1]) : 1920;
      const height = dimensionsMatch ? parseInt(dimensionsMatch[2]) : 1080;
      const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 30;

      return { duration, width, height, fps };
    } catch (error) {
      console.error('Getting video info failed:', error);
      throw error;
    }
  }

  async renderFinalVideo(
    clips: Array<{
      type: 'video' | 'audio' | 'image' | 'text';
      file?: File | Blob;
      startTime: number;
      duration: number;
      x?: number;
      y?: number;
      text?: string;
      fontSize?: number;
      color?: string;
      speed?: number;
    }>,
    outputSettings: {
      width: number;
      height: number;
      fps: number;
      format: string;
      quality: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.initialize();
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    try {
      const inputFiles: string[] = [];
      const filterComplex: string[] = [];
      let inputIndex = 0;

      // Process each clip
      for (const clip of clips) {
        if (clip.type === 'video' && clip.file) {
          const inputName = `input${inputIndex}.mp4`;
          inputFiles.push(inputName);
          await this.ffmpeg.writeFile(inputName, await fetchFile(clip.file));
          
          // Add video filter with timing
          if (clip.speed && clip.speed !== 1) {
            filterComplex.push(`[${inputIndex}:v]setpts=${1/clip.speed}*PTS[v${inputIndex}]`);
          }
          
          inputIndex++;
        } else if (clip.type === 'audio' && clip.file) {
          const inputName = `input${inputIndex}.mp3`;
          inputFiles.push(inputName);
          await this.ffmpeg.writeFile(inputName, await fetchFile(clip.file));
          inputIndex++;
        } else if (clip.type === 'image' && clip.file) {
          const inputName = `input${inputIndex}.png`;
          inputFiles.push(inputName);
          await this.ffmpeg.writeFile(inputName, await fetchFile(clip.file));
          inputIndex++;
        }
      }

      const outputName = `output.${outputSettings.format}`;
      
      // Build FFmpeg command
      const command = [
        ...inputFiles.flatMap(file => ['-i', file]),
        ...(filterComplex.length > 0 ? ['-filter_complex', filterComplex.join(';')] : []),
        '-c:v', 'libx264',
        '-preset', outputSettings.quality === 'high' ? 'slow' : 'fast',
        '-crf', outputSettings.quality === 'high' ? '18' : '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-r', outputSettings.fps.toString(),
        '-s', `${outputSettings.width}x${outputSettings.height}`,
        outputName
      ];

      await this.ffmpeg.exec(command);

      const data = await this.ffmpeg.readFile(outputName);
      
      // Clean up
      for (const inputFile of inputFiles) {
        await this.ffmpeg.deleteFile(inputFile);
      }
      await this.ffmpeg.deleteFile(outputName);

      return new Blob([data], { type: `video/${outputSettings.format}` });
    } catch (error) {
      console.error('Final video rendering failed:', error);
      throw error;
    }
  }

  terminate(): void {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.isLoaded = false;
    }
  }
}

// Export singleton instance
export const ffmpegService = new FFmpegService();
