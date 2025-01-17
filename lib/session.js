import { getWebsiteByUuid, getSessionByUuid, createSession } from 'lib/queries';
import { getClientInfo } from 'lib/request';
import { uuid, isValidUuid, parseToken } from 'lib/crypto';
import { ISO_COUNTRIES } from 'lib/constants';

export async function getSession(req) {
  const { payload } = req.body;

  if (!payload) {
    throw new Error('Invalid request');
  }

  const { website: website_uuid, hostname, screen, language, cache, d_country } = payload;

  if (cache) {
    const result = await parseToken(cache);

    if (result) {
      return result;
    }
  }

  if (!isValidUuid(website_uuid)) {
    throw new Error(`Invalid website: ${website_uuid}`);
  }

  let { userAgent, browser, os, ip, country, device } = await getClientInfo(req, payload);

  const website = await getWebsiteByUuid(website_uuid);

  if (!website) {
    throw new Error(`Website not found: ${website_uuid}`);
  }

  const { website_id } = website;
  const session_uuid = uuid(website_id, hostname, ip, userAgent, os);

  let session = await getSessionByUuid(session_uuid);

  if (!session) {
    if (country === undefined) {
      country = ISO_COUNTRIES[language];
    }

    if (d_country != null && d_country.length === 2) {
      country = d_country;
    }

    session = await createSession(website_id, {
      session_uuid,
      hostname,
      browser,
      os,
      screen,
      language,
      country,
      device,
    });
  }

  const { session_id } = session;

  return {
    website_id,
    session_id,
  };
}
