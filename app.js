
let layers_to_add = [
  new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  new ol.layer.Tile({
    opacity: 0.8,
    source: new ol.source.TileWMS({
      url: 'https://www.geotests.net/geoserver/G5teledec/wms',
      params: {
        layers: 'G5teledec:carte_essences_lvl3',
        format: 'image/png',
        transparent: true
      },
      transition: 0
    })
  })
];


let container = document.getElementById("popup");
let content = document.getElementById("popup-content");
let closer = document.getElementById("popup-closer");

let overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

// Récupérer l'élément de description de la carte
let mapDescription = document.getElementById("map-description");
let mapDescriptionContent = document.getElementById("map-description-content");
let mapDescriptionCloser = document.getElementById("map-description-closer");

// Create buttons with icons for toggling layers
let toggleOSMLayerButton = document.getElementById("toggle-osm-layer");
let toggleWMSLayerButton = document.getElementById("Carte-essences");

// Create an element for the legend
let legendElement = document.createElement('div');
legendElement.id = 'legend';

// Ajouter un contrôle pour la légende
let legendControl = new ol.control.Control({
  element: legendElement,
});

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

let map = new ol.Map({
  target: 'map',
  layers: layers_to_add,
  overlays: [overlay], // Ajout de l'overlay à la carte
  view: new ol.View({
    center: ol.proj.fromLonLat([1.4427953928254333, 43.603905656523054]),
    zoom: 10
  })
});

map.on("singleclick", function (evt) {
  let viewResolution = map.getView().getResolution();
  let coordinate = evt.coordinate;

  // Obtenir la source de la couche WMS
  let wms_source = map.getLayers().item(1).getSource();

  // Vérifiez si la couche WMS est prête
  if (wms_source.getState() === 'ready') {
    // Construisez l'URL pour l'opération GetFeatureInfo
    let url = wms_source.getFeatureInfoUrl(
      coordinate,
      viewResolution,
      map.getView().getProjection(),
      { 'INFO_FORMAT': 'application/json', QUERY_LAYERS: "G5teledec:carte_essences_lvl3" }
    );

    // Vérifiez si l'URL est disponible
    if (url) {
      // Effectuez une requête fetch pour obtenir les informations sur le pixel
      fetch(url)
        .then(function (response) {
          return response.json();
        })
        .then(function (json) {
          console.log('Données WMS:', json);
          // Exemple de traitement des informations JSON
          if (json.features && json.features.length > 0) {
            pixelValue = json.features[0].properties.GRAY_INDEX;
            let msg = getPhraseForPixelValue(pixelValue);
            console.log("Informations sur le pixel:", pixelValue);
            // Afficher les informations dans le popup
            let popupContent = `<p> Essence : ${msg}</p>`;
            // Afficher le popup sur la carte
            content.innerHTML = popupContent;
            overlay.setPosition(coordinate);
          } else {
            console.log("Aucune information disponible pour ce pixel.");
          }
        });
    } else {
      console.log("L'URL GetFeatureInfo n'est pas disponible. La couche WMS peut ne pas être prête.");
    }
  }
});

// Créer un contrôle d'overlay pour la description de la carte
let descriptionOverlay = new ol.Overlay({
  element: mapDescription,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [-150, 100]
  
});
mapDescriptionContent.innerHTML = `Description de la carte:<p> La carte interactive vous offre une représentation détaillée des peuplements forestiers dans la région toulousaine, générée à l'aide d'une classification supervisée. Cette méthode utilise des séries temporelles d'images provenant du satellite Sentinel pour analyser et identifier les différents types de couverture forestière. Les échantillons de référence utilisés pour cette classification proviennent de la Base de Données Forêt (BD Forêt) version 2.0, assurant ainsi une précision et une fiabilité dans la cartographie des zones boisées.<p>Explorez la carte pour visualiser de manière interactive les divers peuplements forestiers et leurs emplacements.`;

// Ajouter l'overlay à la carte
map.addOverlay(descriptionOverlay);

// Afficher la description de la carte au chargement de la page
descriptionOverlay.setPosition(map.getView().getCenter());

// Gérer le clic sur le bouton de fermeture de la description de la carte
mapDescriptionCloser.onclick = function () {
  descriptionOverlay.setPosition(undefined);
  return false;
};

// Toggle the visibility of the OSM layer
toggleOSMLayerButton.onclick = function () {
  let osmLayer = map.getLayers().item(0); 
  osmLayer.setVisible(!osmLayer.getVisible());
};

// Toggle the visibility of the WMS layer
toggleWMSLayerButton.onclick = function () {
  let wmsLayer = map.getLayers().item(1); 
  wmsLayer.setVisible(!wmsLayer.getVisible());
};

// Récupérer le nom de la couche WMS pour laquelle vous souhaitez afficher la légende
let wmsLayerName = 'G5teledec:carte_essences_lvl3'; // Change this to your WMS layer name

// Construire l'URL de GetLegendGraphic
let legendUrl = `https://www.geotests.net/geoserver/G5teledec/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${wmsLayerName}`;

// Afficher la légende sur la carte
if (legendElement) {
  legendElement.innerHTML = `<img src="${legendUrl}" alt="Legend">`;

  // Create a new control for the legend
  let legendControl = new ol.control.Control({
    element: legendElement,
  });
  
  // Ajouter le contrôle à la carte
  map.addControl(legendControl);
  
  // Adjust the initial visibility of the legend
  let isLegendVisible = true; // Set to false if you want to initially hide the legend
  legendControl.element.style.display = isLegendVisible ? 'block' : 'none';
  // Adjust the position of the legend to the top-left corner
  legendControl.element.style.position = 'absolute';
  legendControl.element.style.top = '245px'; 
  legendControl.element.style.left = '1190px'; 

  // Create a button to toggle the legend visibility
  let toggleLegendButton = document.createElement('button');
  toggleLegendButton.textContent = 'Toggle Legend';
  toggleLegendButton.addEventListener('click', function () {
    isLegendVisible = !isLegendVisible;
    legendControl.element.style.display = isLegendVisible ? 'block' : 'none';
  });

  // Append the button to the document
  document.body.appendChild(toggleLegendButton);
} else {
  console.error('Failed to create legend element.');
}

//fonction pour convertir la valeur de pixel 
function getPhraseForPixelValue(pixelValue) {
  if (pixelValue == 101) {
    return "Autres feuillus pur";
  } else if (pixelValue == 102) {
    return "Chêne pur";
  } else if (pixelValue == 103) {
    return "Robinier pur";
  }else if (pixelValue == 104) {
    return "Mélange de feuillus";
  }else if (pixelValue == 110) {
    return "Peupleraie";
  }else if (pixelValue == 211) {
    return "Autres conifères purs autres que pins";
  }else if (pixelValue == 212) {
    return "Douglas pur";
  }else if (pixelValue == 221) {
    return "Pin laricio ou pin noir pur";
  }else if (pixelValue == 222) {
    return "Autre pin pur";
  }else if (pixelValue == 230) {
    return "Mélange pins et autres conifères";
  }else {
    return "Pas d'information";
  }
};
