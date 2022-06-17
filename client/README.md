# DSRAnalytics Client

Client for the DSRAnalytics API.

## Usage

### NPM

Install the DSRAnalytics client:

```bash
npm i --save dsr-analytics
```

Use the client to track things:

```js
import useDSRA from 'dsr-analytics';
const dsra = useDSRA('<WEBSITE_ID>', '<API_HOST>', { autoView: false });
dsra.sendView(location.href, document.referrer);
```

### CDN

```html
<script
  async
  data-id="<WEBSITE_ID>"
  data-host="<API_HOST>"
  src="https://cdn.jsdelivr.net/npm/dsr-analytics@1.0.0/dist/client.min.js"
></script>
```

## API

### Options

```js
const options: Options = {
  autoView: false, // auto collect views
  autoVital: true, // auto collect vitals
  autoError: true, // auto collect errors
};
```

```html
<script
  async
  data-id="<WEBSITE_ID>"
  data-host="<API_HOST>"
  src="https://cdn.jsdelivr.net/npm/dsr-analytics@1.0.0/dist/client.min.js"
  data-auto-view="false"
  data-auto-vital="true"
  data-auto-error="true"
></script>
```

### Methods

```js
/**
 * send view data
 * @param href href path from location.href etc.
 * @param title custom page title
 * @param referrer custom referrer
 */
dsra.sendView = (href: string, title?: string, referrer?: string) => {};
/**
 * send vital data
 * @param href href path from location.href etc.
 * @param value web vital partial/full data
 */
dsra.sendVital = (href: string, value: VitalData) => {};
/**
 * record error
 * @param href href path from location.href etc.
 * @param error javascript error
 */
dsra.sendError = (href: string, type: ErrorType, error: Error) => {};
```
