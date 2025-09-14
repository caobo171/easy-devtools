export interface VideoClip {
  id: string;
  src: string;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  speed: number;
  volume: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AudioClip {
  id: string;
  src: string;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  speed: number;
  volume: number;
}

export interface ImageClip {
  id: string;
  src: string;
  name: string;
  duration: number;
  startTime: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

export interface TextClip {
  id: string;
  text: string;
  duration: number;
  startTime: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  opacity: number;
}

export interface Timeline {
  videoTracks: VideoClip[];
  audioTracks: AudioClip[];
  imageTracks: ImageClip[];
  textTracks: TextClip[];
  totalDuration: number;
}

export interface VideoProject {
  id: string;
  name: string;
  timeline: Timeline;
  settings: {
    width: number;
    height: number;
    fps: number;
    backgroundColor: string;
  };
}

export type ClipType = VideoClip | AudioClip | ImageClip | TextClip;
export type TrackType = 'video' | 'audio' | 'image' | 'text';
