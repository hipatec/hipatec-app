export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'hipatec.pages.dev') {
    url.hostname = 'hipatec.app';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
