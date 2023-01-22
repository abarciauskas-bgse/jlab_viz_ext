import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import mapboxgl, { Map } from 'mapbox-gl';
import { PageConfig } from '@jupyterlab/coreutils';
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import {
  NotebookActions,
  INotebookTracker
} from '@jupyterlab/notebook';

export function activateFileSelection(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  factory: IFileBrowserFactory,
  notebookTracker: INotebookTracker
): void {
  const { commands } = app;
  const { tracker } = factory;

  // matches all filebrowser items
  const selectorItem = '.jp-DirListing-item[data-isdir]';
  const fileCommand = 'select this file';
  commands.addCommand(fileCommand, {
    execute: () => {

      // get filebrowser item
      const widget = tracker.currentWidget;
      const current = notebookTracker.currentWidget;
      console.log(`current notebook is ${current}`)      
      if (!widget) {
        return;
      }
      const item = widget.selectedItems().next();
      if (!item) {
        return;
      }

      // get full path, not just relative path of script to register
      let path = PageConfig.getOption('serverRoot') + '/' + item.path;
      if (current) {
        console.log(`current is ${current}`)
        NotebookActions.insertBelow(current.content);
        NotebookActions.paste(current.content);
        current.content.mode = 'edit';
        const insert_text = `# generated from this ${path}`;
        if (current.content.activeCell) {
          current.content.activeCell.model.value.text = insert_text; 
        }
      }     
      console.log(path);
    },
    isVisible: () => true, 
    iconClass: 'jp-MaterialIcon jp-ImageIcon',
    label: fileCommand
  });

  app.contextMenu.addItem({
    command: fileCommand,
    selector: selectorItem,
    rank: 10
  });
}

class VizWidget extends Widget {
  /**
  * Construct a new viz widget.
  */
  constructor() {
    super();

    this.addClass('vizWidget');
    console.log("loading widget!")  

    this.div = document.createElement('div');
    this.div.id = "container";
    this.node.appendChild(this.div);
  }
  readonly div: HTMLDivElement;
}

mapboxgl.accessToken = 'ADD ME'; 
function drawMap() {
  const map = new Map({
    container: 'container', // container ID
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/satellite-v9', // style URL
    center: [-91.874, 42.76], // starting position [lng, lat]
    zoom: 10 // starting zoom    
  });
  //map.addLayer()
  return map;
}
/**
* Activate the viz widget extension.
*/
function activate(app: JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer, factory: IFileBrowserFactory, notebookTracker: INotebookTracker) {
  console.log('JupyterLab extension jupyterlab_viz is activated!');

  // Declare a widget variable
  let widget: MainAreaWidget<VizWidget>;
  activateFileSelection(app, palette, factory, notebookTracker);

  // Add an application command
  const command: string = 'viz:open';
  app.commands.addCommand(command, {
    label: 'Open Map',
    execute: () => {
      if (!widget || widget.isDisposed) {
        // Create a new widget if one does not exist
        // or if the previous one was disposed after closing the panel
        const content = new VizWidget();
        widget = new MainAreaWidget({content});
        widget.id = 'viz-jupyterlab';
        widget.title.label = 'Astronomy Picture';
        widget.title.closable = true;        
      }
      if (!tracker.has(widget)) {
        // Track the state of the widget for later restoration
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.add(widget, 'main');
        drawMap();
      }
      widget.content.update();

      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({ command, category: 'Tutorial' });

  // Track and restore the widget state
  let tracker = new WidgetTracker<MainAreaWidget<VizWidget>>({
    namespace: 'viz'
  });
  restorer.restore(tracker, {
    command,
    name: () => 'viz'
  });
}

/**
 * Initialization data for the jupyterlab_viz extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-viz',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer, IFileBrowserFactory, INotebookTracker],
  activate: activate   
}

export default plugin;
