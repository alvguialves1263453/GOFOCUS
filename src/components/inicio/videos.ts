/**
 * Videos shown in the "Vídeos" section of the home page.
 * Add one line per YouTube video: the id is the part after "v=" in the link
 * (https://www.youtube.com/watch?v=XXXXXXXXXXX). While this list is empty,
 * the section shows a link to the Instagram instead.
 */
export interface HomeVideo {
  title: string;
  youtubeId: string;
}

export const VIDEOS: HomeVideo[] = [];
