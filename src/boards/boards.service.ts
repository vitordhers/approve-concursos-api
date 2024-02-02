import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { DbService } from 'src/db/db.service';
import { UploadService } from 'src/upload/upload.service';
import { Entity } from 'src/db/enums/entity.enum';
import { ConfigService } from '@nestjs/config';
import { MIGRATIONS } from 'src/db/constants/migrations.const';
import { inspect } from 'util';
import { MigrationBase } from 'src/db/interfaces/migration.interface';
import { SerializationService } from 'src/serialization/serialization.service';
import { BaseBoard } from './interfaces/base-board.interface';

@Injectable()
export class BoardsService implements OnModuleInit {
  private logger = new Logger('BoardsService');
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  private entity = Entity.BOARDS;
  constructor(
    private readonly dbService: DbService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly serializationService: SerializationService,
  ) {}

  async onModuleInit() {
    if (!this.shouldRunMigrations) return;
    await this.runMigrations();
  }

  async runMigrations() {
    try {
      const migrations = MIGRATIONS.get(this.entity);
      if (!migrations.length) return;

      for (const migration of migrations) {
        const foundMigration = await this.dbService.findOneWhere(
          'migrations',
          `name = '${migration.name}'`,
        );
        if (foundMigration) continue;
        this.logger.warn(
          `migration ${migration.name} wasn't found in database, running it`,
        );
        const migrationResult = await this.dbService.query(migration.query);
        if (!Array.isArray(migrationResult)) {
          this.logger.error(`migration failed ${inspect({ migration })}`);
          continue;
        }
        this.logger.log(
          `migration ${migration.name} succeeded, saving it to database`,
        );
        const currentTimestamp = Date.now();
        const migrationRecord: MigrationBase = {
          ...migration,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        };

        const storedMigrationResult = await this.dbService.create(
          'migrations',
          migrationRecord,
        );
        this.logger.log(
          `migration ${migration.name} stored! ${inspect(
            { storedMigrationResult },
            { depth: null },
          )}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `runMigrations error ${inspect({ error }, { depth: null })}`,
      );
    }
  }

  async create({ name, img, thumb }: CreateBoardDto) {
    const currentTimestamp = Date.now();
    const newBoard: BaseBoard = {
      name,
      img,
      thumb,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    const result = await this.dbService.create<BaseBoard>(
      this.entity,
      newBoard,
    );
    return this.serializationService.serializeBoardResult(result[0]);
  }

  async paginate(startAt: number, limit: number) {
    const results = await this.dbService.paginate<BaseBoard>(
      this.entity,
      startAt,
      limit,
    );
    const data = results.data.map((i) =>
      this.serializationService.serializeBoardResult(i),
    );
    return { total: results.total, data };
  }

  findAll() {
    return `This action returns all boards`;
  }

  async findOne(uid: string) {
    uid = this.serializationService.regularUidToSurrealId(this.entity, uid);
    const result = await this.dbService.findOneByUid<BaseBoard>(
      this.entity,
      uid,
    );
    return this.serializationService.serializeBoardResult(result);
  }

  async search(searchedValue: string) {
    const result = await this.dbService.search<BaseBoard>(
      this.entity,
      'name',
      searchedValue,
    );
    if (!result || !result.length) return [];
    const data = result.map((r) =>
      this.serializationService.serializeBoardResult(r),
    );
    return data;
  }

  async update(uid: string, { name, img, thumb }: UpdateBoardDto) {
    const currentBoard = await this.findOne(uid);

    if (!currentBoard) {
      throw new BadRequestException(`board with id ${uid} doesn't exist`);
    }

    let updatedImg: string | undefined = currentBoard.img;
    if (currentBoard.img && img !== currentBoard.img) {
      await this.uploadService.deleteFile(currentBoard.img);
      updatedImg = img;
    }

    let updatedThumb: string | undefined = currentBoard.thumb;
    if (currentBoard.thumb && thumb !== currentBoard.thumb) {
      await this.uploadService.deleteFile(currentBoard.thumb);
      updatedThumb = thumb;
    }

    const currentTimestamp = Date.now();
    const updatedBoard: BaseBoard = {
      name,
      img: updatedImg,
      thumb: updatedThumb,
      updatedAt: currentTimestamp,
    };

    const result = await this.dbService.update<BaseBoard>(
      this.entity,
      uid,
      updatedBoard,
    );
    return this.serializationService.serializeBoardResult(result);
  }

  async remove(uid: string) {
    const toBeDeletedBoard = await this.findOne(uid);
    if (!toBeDeletedBoard) {
      throw new BadRequestException(`Board with id ${uid} doesn't exist`);
    }
    if (toBeDeletedBoard.img) {
      await this.uploadService.deleteFile(toBeDeletedBoard.img);
    }
    if (toBeDeletedBoard.thumb) {
      await this.uploadService.deleteFile(toBeDeletedBoard.thumb);
    }
    await this.dbService.delete(this.entity, uid);
  }
}
