import { createBrowserHistory } from 'history'

const basename = new URL(document.baseURI).pathname

export default createBrowserHistory({ basename })
