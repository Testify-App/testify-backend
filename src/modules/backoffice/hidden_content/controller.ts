import { StatusCodes } from 'http-status-codes';
import { fnRequest } from '../../../shared/types';
import { calcPages } from '../../../shared/helpers';
import * as Response from '../shared/lib/api-response';
import { HttpException } from '../shared/lib/errors';
import { actorContext } from '../shared/lib/request-context';
import HiddenContentService from './repositories';

export class HiddenContentController {
  public fetchHidden: fnRequest = async (req, res) => {
    const query = req.query as any;
    const [meta, items, counts] = await HiddenContentService.fetchHidden(query);
    return Response.success(res, 'Hidden content fetched successfully.', StatusCodes.OK, {
      items,
      counts,
      total: meta.count,
      currentPage: query.page,
      totalPages: calcPages(meta.count, query.limit),
    });
  };

  public restore: fnRequest = async (req, res) => {
    const response = await HiddenContentService.restore(
      req.params.type as any, req.params.content_id, req.body?.note, actorContext(req),
    );
    if (response instanceof HttpException) return Response.error(res, response, response.code);
    return Response.success(res, 'Content restored.', StatusCodes.OK, response);
  };
}

const hiddenContentController = new HiddenContentController();

export default hiddenContentController;
