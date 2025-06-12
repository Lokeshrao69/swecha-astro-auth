// src/utils/media-utils.ts
import { MediaAPI } from '../services/api-service';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  chunks: Blob[];
}

export interface VideoRecordingState extends RecordingState {
  videoElement: HTMLVideoElement | null;
}

export class AudioRecorder {
  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    mediaRecorder: null,
    stream: null,
    chunks: []
  };

  private durationInterval: number | null = null;
  private onStateChange?: (state: RecordingState) => void;

  constructor(onStateChange?: (state: RecordingState) => void) {
    this.onStateChange = onStateChange;
  }

  async startRecording(): Promise<void> {
    try {
      this.state.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      this.state.mediaRecorder = new MediaRecorder(this.state.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.state.chunks = [];
      this.state.duration = 0;

      this.state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.state.chunks.push(event.data);
        }
      };

      this.state.mediaRecorder.onstart = () => {
        this.state.isRecording = true;
        this.startDurationTimer();
        this.notifyStateChange();
      };

      this.state.mediaRecorder.onstop = () => {
        this.state.isRecording = false;
        this.stopDurationTimer();
        this.notifyStateChange();
      };

      this.state.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Could not start recording. Please check microphone permissions.');
    }
  }

  pauseRecording(): void {
    if (this.state.mediaRecorder && this.state.isRecording && !this.state.isPaused) {
      this.state.mediaRecorder.pause();
      this.state.isPaused = true;
      this.stopDurationTimer();
      this.notifyStateChange();
    }
  }

  resumeRecording(): void {
    if (this.state.mediaRecorder && this.state.isRecording && this.state.isPaused) {
      this.state.mediaRecorder.resume();
      this.state.isPaused = false;
      this.startDurationTimer();
      this.notifyStateChange();
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.state.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.state.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.state.chunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.state.mediaRecorder.stop();
    });
  }

  async uploadRecording(topic: string): Promise<void> {
    try {
      const audioBlob = await this.stopRecording();
      
      const uploadResponse = await MediaAPI.uploadAudio(audioBlob, {
        topic,
        duration: this.state.duration,
        format: 'webm'
      });

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Upload failed');
      }

      console.log('Audio uploaded successfully:', uploadResponse);
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  private startDurationTimer(): void {
    this.durationInterval = window.setInterval(() => {
      this.state.duration += 1;
      this.notifyStateChange();
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  private cleanup(): void {
    this.stopDurationTimer();
    
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
    }

    this.state = {
      isRecording: false,
      isPaused: false,
      duration: 0,
      mediaRecorder: null,
      stream: null,
      chunks: []
    };

    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  getState(): RecordingState {
    return { ...this.state };
  }

  destroy(): void {
    if (this.state.isRecording) {
      this.stopRecording().catch(console.error);
    }
    this.cleanup();
  }
}

export class VideoRecorder {
  private state: VideoRecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    mediaRecorder: null,
    stream: null,
    chunks: [],
    videoElement: null
  };

  private durationInterval: number | null = null;
  private onStateChange?: (state: VideoRecordingState) => void;

  constructor(videoElement: HTMLVideoElement, onStateChange?: (state: VideoRecordingState) => void) {
    this.state.videoElement = videoElement;
    this.onStateChange = onStateChange;
  }

  async startRecording(): Promise<void> {
    try {
      this.state.stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (this.state.videoElement) {
        this.state.videoElement.srcObject = this.state.stream;
        this.state.videoElement.play();
      }

      this.state.mediaRecorder = new MediaRecorder(this.state.stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      this.state.chunks = [];
      this.state.duration = 0;

      this.state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.state.chunks.push(event.data);
        }
      };

      this.state.mediaRecorder.onstart = () => {
        this.state.isRecording = true;
        this.startDurationTimer();
        this.notifyStateChange();
      };

      this.state.mediaRecorder.onstop = () => {
        this.state.isRecording = false;
        this.stopDurationTimer();
        this.notifyStateChange();
      };

      this.state.mediaRecorder.start(1000);
    } catch (error) {
      console.error('Error starting video recording:', error);
      throw new Error('Could not start video recording. Please check camera and microphone permissions.');
    }
  }

  async uploadRecording(topic: string): Promise<void> {
    try {
      const videoBlob = await this.stopRecording();
      
      const uploadResponse = await MediaAPI.uploadVideo(videoBlob, {
        topic,
        duration: this.state.duration,
        format: 'webm'
      });

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Upload failed');
      }

      console.log('Video uploaded successfully:', uploadResponse);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.state.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.state.mediaRecorder.onstop = () => {
        const videoBlob = new Blob(this.state.chunks, { type: 'video/webm' });
        this.cleanup();
        resolve(videoBlob);
      };

      this.state.mediaRecorder.stop();
    });
  }

  private startDurationTimer(): void {
    this.durationInterval = window.setInterval(() => {
      this.state.duration += 1;
      this.notifyStateChange();
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  private cleanup(): void {
    this.stopDurationTimer();
    
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
    }

    if (this.state.videoElement) {
      this.state.videoElement.srcObject = null;
    }

    this.state = {
      ...this.state,
      isRecording: false,
      isPaused: false,
      duration: 0,
      mediaRecorder: null,
      stream: null,
      chunks: []
    };

    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  getState(): VideoRecordingState {
    return { ...this.state };
  }

  destroy(): void {
    if (this.state.isRecording) {
      this.stopRecording().catch(console.error);
    }
    this.cleanup();
  }
}

// Image Upload Utility
export class ImageUploader {
  static async uploadImage(file: File, topic: string, description?: string): Promise<void> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image file too large. Please select a file under 10MB');
      }

      const uploadResponse = await MediaAPI.uploadImage(file, {
        topic,
        description
      });

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Upload failed');
      }

      console.log('Image uploaded successfully:', uploadResponse);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

// Text Submission Utility
export class TextSubmitter {
  static async submitText(content: string, topic: string): Promise<void> {
    try {
      if (!content.trim()) {
        throw new Error('Please enter some text');
      }

      if (content.length < 10) {
        throw new Error('Text should be at least 10 characters long');
      }

      const submitResponse = await MediaAPI.submitText({
        topic,
        content: content.trim(),
        language: 'te'
      });

      if (!submitResponse.success) {
        throw new Error(submitResponse.message || 'Submission failed');
      }

      console.log('Text submitted successfully:', submitResponse);
    } catch (error) {
      console.error('Error submitting text:', error);
      throw error;
    }
  }
}

// Utility functions
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
