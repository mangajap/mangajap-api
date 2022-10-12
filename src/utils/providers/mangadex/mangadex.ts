import axios from 'axios';
import Chapter from '../../../models/chapter.model';
import Manga from '../../../models/manga.model';
import Volume from '../../../models/volume.model';

export default class MangaDex {

  public static async findMangaById(id: string) {
    const manga = await axios.get<MangaDexManga>(`https://api.mangadex.org/manga/${id}`)
      .then((res) => res.data)
      .then((response) => {
        if (response.result === 'error') {
          return null;
        } else {
          return new Manga({
            title: response.data.attributes.title.en,
            titles: response.data.attributes.altTitles.reduce((acc, cur) => {
              return Object.assign(acc, cur);
            }, {}),

            volumes: [],
            chapters: [],
          });
        }
      });

    if (manga === null) return manga;

    await axios.get<MangaDexVolumes>(`https://api.mangadex.org/manga/${id}/aggregate`)
      .then((res) => res.data)
      .then((data) => {
        Object.values(data.volumes).forEach((volume) => {
          const chapters = Object.values(volume.chapters)
            .filter((chapter) => +chapter.chapter && Number.isInteger(+chapter.chapter))
            .map((chapter) => {
              return new Chapter({
                number: +chapter.chapter,
              });
            });

          if (+volume.volume && Number.isInteger(+volume.volume)) {
            manga.volumes = manga.volumes?.concat(new Volume({
              number: +volume.volume,

              chapters: chapters,
            }));
          }

          manga.chapters = manga.chapters?.concat(chapters);
        });
      });

    for (let i = 0; i < (manga.volumes?.length ?? 0) / 100; i++) {
      await axios.get<MangaDexCovers>(`https://api.mangadex.org/cover?manga[]=${id}&limit=100&offset=${i * 100}&order[volume]=asc`)
        .then((res) => res.data)
        .then((covers) => covers.data.filter((cover) => cover.attributes.locale === 'ja'))
        .then((covers) => covers.filter((cover) => +cover.attributes.volume && Number.isInteger(+cover.attributes.volume)))
        .then((covers) => {
          covers.forEach((cover) => {
            let volume = manga.volumes?.find((volume) => volume.number === +cover.attributes.volume)

            if (volume) {
              volume.coverImage = cover ?
                `https://uploads.mangadex.org/covers/${id}/${cover.attributes.fileName}` :
                null;
            } else {
              volume = new Volume({
                number: +cover.attributes.volume,
                coverImage: cover ?
                  `https://uploads.mangadex.org/covers/${id}/${cover.attributes.fileName}` :
                  null,
              });
              manga.volumes?.push(volume);
            }
          });
        })
    }

    return manga;
  }
}

export interface MangaDexManga {
  result: 'ok' | 'error'
  response: 'entity'
  data: {
    id: string
    type: 'manga'
    attributes: {
      title: {
        [language: string]: string
      }
      altTitles: {
        [language: string]: string
      }[]
      description: {
        [language: string]: string
      }
      isLocked: boolean
      links: {
        al: string
        ap: string
        bw: string
        kt: string
        mu: string
        amz: string
        cdj: string
        ebj: string
        mal: string
        raw: string
        engtl: string
      }
      originalLanguage: string
      lastVolume: string
      lastChapter: string
      publicationDemographic: 'shounen' | 'shoujo' | 'josei' | 'seinen'
      status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled'
      year: number
      contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic'
      tags: {
        id: string
        type: 'tag'
        attributes: {
          name: {
            [language: string]: string
          }
          description: [
          ]
          group: 'genre' | 'format' | 'theme' | 'content'
          version: number
        }
        relationships: {
          id: string
          type: string
        }[]
      }[]
      state: 'published'
      chapterNumbersResetOnNewVolume: boolean
      createdAt: string
      updatedAt: string
      version: number
      availableTranslatedLanguages: string[]
    }
    relationships: {
      id: string
      type: string
      related?: 'monochrome' | 'colored' | 'preserialization' | 'serialization' | 'prequel' | 'sequel' | 'main_story' | 'side_story' | 'adapted_from' | 'spin_off' | 'based_on' | 'doujinshi' | 'same_franchise' | 'shared_universe' | 'alternate_story' | 'alternate_version'
    }[]
  }
}

export interface MangaDexVolumes {
  result: 'ok' | 'error';
  volumes: {
    [volume: string]: {
      volume: string;
      count: number;
      chapters: {
        [chapters: string]: {
          chapter: string;
          id: string;
          others: string[];
          count: number;
        };
      };
    };
  }
}

export interface MangaDexCovers {
  result: 'ok' | 'error',
  response: 'collection',
  data: {
    id: string
    type: 'cover_art',
    attributes: {
      description: string
      volume: string
      fileName: string
      locale: string
      createdAt: string
      updatedAt: string
      version: string
    },
    relationships: {
      id: string
      type: 'manga' | 'user'
    }[]
  }[],
  limit: number,
  offset: number,
  total: number
}
