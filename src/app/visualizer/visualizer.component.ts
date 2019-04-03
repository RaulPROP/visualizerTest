/* tslint:disable:one-line prefer-for-of */
import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';

import {
  BoxBufferGeometry,
  Clock,
  Color,
  CylinderBufferGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PerspectiveCamera,
  RawShaderMaterial,
  Scene,
  SphereBufferGeometry,
  TorusBufferGeometry,
  TrackballControls,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three-full';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css']
})
export class VisualizerComponent implements OnInit {

  /**
   * THREEJS
   */

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: TrackballControls;
  private clock: Clock;

  /**
   * OTHERS
   */

  @ViewChild('wrapper') wrapper: ElementRef<HTMLCanvasElement>;

  public showingOne = true;
  public showingTwo = true;

  private materialsLoaded = false;

  private meshBoxes: Mesh;
  private uniqueMeshBoxes: Mesh;

  private meshSpheres: Mesh;
  private uniqueMeshSpheres: Mesh;

  public darkTheme = true;

  private hoverTarget: WebGLRenderTarget;
  private uniqueNodesMaterial: RawShaderMaterial;
  private numElements = 1;
  private otherScene: Scene;

  private nodesMaterial: RawShaderMaterial;

  private clockTime = 0;

  private sceneRadius = 300;

  private renderingHoverScene = false;
  public debugMode = false;

  private allForms = {
    ['sphere']: {key: 'sphere', buffer: SphereBufferGeometry, params: [1, 8, 8]},
    ['box']: {key: 'sphere', buffer: BoxBufferGeometry, params: [2, 2, 2]},
    ['cylinder']: {key: 'cylinder', buffer: CylinderBufferGeometry, params: [0.5, 0.5, 2, 8]},
    ['torus']: {key: 'torus', buffer: TorusBufferGeometry, params: [1, 0.5, 8, 8]},
  };

  public allFormsKeys: string[] = ['sphere', 'box', 'cylinder', 'torus'];

  public figuresIds: string[] = ['cylinder', 'box'];
  private figureMeshes: Mesh[] = [null, null];
  private figureUniqueMeshes: Mesh[] = [null, null];

  constructor(private http: HttpClient, private htmlRenderer: Renderer2) {}

  ngOnInit(): void
  {

    this.initThree();

    this.http.get(
      'assets/shaders/nodes.vert',
      {responseType: 'text'}
    ).toPromise().then(async (nodesVert) => {

      this.http.get(
        'assets/shaders/nodes.frag',
        {responseType: 'text'}
      ).toPromise().then(async (nodesFrag) => {

        this.http.get(
          'assets/shaders/uniqueNodes.vert',
          {responseType: 'text'}
        ).toPromise().then(async (uniqueNodesVert) => {

          const nodesUniforms = {
            cameraPosition: {value: {
                x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z
              }},
            time: {value: this.clockTime},
            hoveredIndex: {value: 0},
            radius: {value: this.sceneRadius},
            dark: {value: this.darkTheme ? 1 : 0},
            showingOne: {value: this.showingOne ? 1 : 0},
            showingTwo: {value: this.showingTwo ? 1 : 0},
          };

          this.nodesMaterial = new RawShaderMaterial( {
            uniforms:       nodesUniforms,
            vertexShader:   nodesVert,
            fragmentShader: nodesFrag,
            transparent:    true
          });

          this.uniqueNodesMaterial = new RawShaderMaterial( {
            uniforms:       nodesUniforms,
            vertexShader:   uniqueNodesVert,
            fragmentShader: nodesFrag,
            transparent:    true
          });

          // this.initBackgroundMeshes();

          this.initMeshes();

          this.renderHoverScene();

          this.materialsLoaded = true;

        });

      });

    });

    }

  private initThree(): void
  {

    const width: number = this.wrapper.nativeElement.clientWidth;
    const height: number = this.wrapper.nativeElement.clientHeight;

    this.hoverTarget = new WebGLRenderTarget(width, height);

    const gl = this.canvas.nativeElement.getContext('webgl');

    if (gl) {

      gl.enableVertexAttribArray(0);

      this.renderer = new WebGLRenderer({
        canvas: this.canvas.nativeElement,
        context: gl,
        antialias: true,
        alpha: true
      });

    }

    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( width, height );
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.autoClear = true;

    this.scene = new Scene();
    this.otherScene = new Scene();

    this.otherScene.background = new Color(0xffffff);

    if (this.darkTheme) {
      this.scene.background = new Color(0x4c4c4c);
    } else {
      this.scene.background = new Color(0xf0f0f0);
    }

    // this.sceneRadius = Math.sqrt((this.numSpheres + this.numBoxes) * Math.PI * 20) * 4;

    this.camera = new PerspectiveCamera(60, width / height, 1, 20000);
    this.camera.position.z = 500 + this.sceneRadius;
    this.camera.lookAt(this.scene.position);

    this.controls = new TrackballControls(this.camera, this.canvas.nativeElement);
    this.controls.rotateSpeed = 1;
    this.controls.zoomSpeed = 0.5;

    this.controls.noZoom = false;
    this.controls.noPan = true;

    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 0.2;

    this.controls.keys = [65, 83, 68];

    this.controls.addEventListener( 'change', () => {

      this.nodesMaterial.uniforms.cameraPosition.value.x = this.camera.position.x;
      this.nodesMaterial.uniforms.cameraPosition.value.y = this.camera.position.y;
      this.nodesMaterial.uniforms.cameraPosition.value.z = this.camera.position.z;

      this.uniqueNodesMaterial.uniforms.cameraPosition.value.x = this.camera.position.x;
      this.uniqueNodesMaterial.uniforms.cameraPosition.value.y = this.camera.position.y;
      this.uniqueNodesMaterial.uniforms.cameraPosition.value.z = this.camera.position.z;

      this.renderHoverScene();

    });

    this.canvas.nativeElement.addEventListener('mousemove', this.onMouseMove.bind(this));

    this.clock = new Clock();
    this.clock.start();

    this.animate();

    window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

  }

  private initMeshes(): void
  {

    for (let i = 0; i < this.figuresIds.length; i++) {

      const geoKey = this.figuresIds[i];

      const geoAux = this.allForms[geoKey];

      const geo = new InstancedBufferGeometry();
      const form = new (geoAux.buffer)(...geoAux.params);

      const uniqueGeo = new InstancedBufferGeometry();
      const uniqueForm = new (geoAux.buffer)(...geoAux.params);

      Object.keys(form.attributes).forEach(attributeName => {
        geo.attributes[attributeName] = form.attributes[attributeName];
      });

      Object.keys(uniqueForm.attributes).forEach(attributeName => {
        uniqueGeo.attributes[attributeName] = uniqueForm.attributes[attributeName];
      });

      geo.index = form.index;

      geo.maxInstancedCount = 0;

      uniqueGeo.index = uniqueForm.index;
      uniqueGeo.maxInstancedCount = 0;

      const sizeBuffer = new Float32Array(0);
      const sphereBuffer = new Float32Array(0);
      const colorBuffer = new Float32Array(0);
      const uniqueColorBuffer = new Float32Array(0);
      const uniqueIndexBuffer = new Float32Array(0);
      const offsetBuffer = new Float32Array(0);

      const colorAtt = new InstancedBufferAttribute( colorBuffer, 3, false );
      geo.addAttribute( 'color',  colorAtt);

      const uniqueColorAtt = new InstancedBufferAttribute( uniqueColorBuffer, 3, false );
      uniqueGeo.addAttribute('color', uniqueColorAtt);

      const sizeAtt = new InstancedBufferAttribute( sizeBuffer, 1, false );
      geo.addAttribute( 'size', sizeAtt);
      uniqueGeo.addAttribute( 'size', sizeAtt);

      const sphereAtt = new InstancedBufferAttribute( sphereBuffer, 1, false );
      geo.addAttribute( 'nodeType', sphereAtt);
      uniqueGeo.addAttribute( 'nodeType', sphereAtt);

      const offsetAtt = new InstancedBufferAttribute( offsetBuffer, 3, false );
      geo.addAttribute('offset', offsetAtt);
      uniqueGeo.addAttribute('offset', offsetAtt);

      const uniqueIndexAtt = new InstancedBufferAttribute( uniqueIndexBuffer, 1, false );
      geo.addAttribute('nodeIndex', uniqueIndexAtt);

      const mesh = new Mesh(geo, this.nodesMaterial);
      const uniqueMesh = new Mesh(uniqueGeo, this.uniqueNodesMaterial);

      this.figureMeshes[i] = mesh;
      this.figureUniqueMeshes[i] = uniqueMesh;

      this.scene.add(mesh);
      this.otherScene.add(uniqueMesh);

    }

  }

  private initBackgroundMeshes(): void
  {

    const numBgRows = 50;
    const numBgColumns = 50;
    const numBgElements = numBgRows * numBgColumns;

    const geo = new InstancedBufferGeometry();
    const form = new BoxBufferGeometry(1, 1, 1);

    Object.keys(form.attributes).forEach(attributeName => {
      geo.attributes[attributeName] = form.attributes[attributeName];
    });

    geo.index = form.index;

    geo.maxInstancedCount = numBgElements;

    const sizeBuffer = new Float32Array(numBgElements);
    const colorBuffer = new Float32Array(3 * numBgElements);
    const offsetBuffer = new Float32Array(3 * numBgElements);
    const typeBuffer = new Float32Array(numBgElements);

    for (let i = 0; i < numBgRows; i++) {

      for (let j = 0; j < numBgColumns; j++) {

        const index = (i * numBgColumns) + j;

        sizeBuffer[index] = 10;

        typeBuffer[index] = 3;

        colorBuffer[(index * 3) + 0] = Math.random();
        colorBuffer[(index * 3) + 1] = Math.random();
        colorBuffer[(index * 3) + 2] = Math.random();

        offsetBuffer[(index * 3) + 0] = ((-numBgColumns / 2) * 10) + (j * 10);
        offsetBuffer[(index * 3) + 1] = ((-numBgRows / 2) * 10) + (i * 10);
        offsetBuffer[(index * 3) + 2] = 0;

      }

    }

    const colorAtt = new InstancedBufferAttribute( colorBuffer, 3, false );
    geo.addAttribute( 'color',  colorAtt );

    const sizeAtt = new InstancedBufferAttribute( sizeBuffer, 1, false );
    geo.addAttribute( 'size', sizeAtt );

    const offsetAtt = new InstancedBufferAttribute( offsetBuffer, 3, false );
    geo.addAttribute('offset', offsetAtt );

    const typeAtt = new InstancedBufferAttribute( typeBuffer, 1, false );
    geo.addAttribute('nodeType', typeAtt );

    const mesh = new Mesh(geo, this.nodesMaterial);

    this.scene.add(mesh);

  }

  public addMeshes(index: number): void
  {

    const key = this.figuresIds[index];

    const elements = Math.floor(Math.random() * 100);

    const mesh = this.figureMeshes[index];
    const uniqueMesh = this.figureUniqueMeshes[index];

    const formAux = this.allForms[key];

    const form = new (formAux.buffer)(...formAux.params);

    const dontUpdateKeys = Object.keys(form.attributes);

    const updateKeys = Object.keys(mesh.geometry.attributes).filter(x => !dontUpdateKeys.includes(x));

    for (let i = 0; i < updateKeys.length; i++) {

      const attribute = updateKeys[i];

      const newValues: number[] = this.getNewValuesFor(attribute, elements, index);

      const itemSize = mesh.geometry.attributes[attribute].itemSize;

      const oldArray = mesh.geometry.attributes[attribute].array;
      const newArray = new Float32Array(oldArray.length + newValues.length);
      const newArrayCopy = new Float32Array(oldArray.length + newValues.length);

      const oldLength = oldArray.length;

      for (let j = 0; j < oldLength; j++) {

        newArray[j] = oldArray[j];
        newArrayCopy[j] = oldArray[j];

      }

      for (let j = 0; j < newValues.length; j++) {

        newArray[oldLength + j] = newValues[j];
        newArrayCopy[oldLength + j] = newValues[j];

      }

      mesh.geometry.attributes[attribute].array = newArray;
      mesh.geometry.attributes[attribute].count = (newArray.length / itemSize);
      mesh.geometry.attributes[attribute].needsUpdate = true;

      if (uniqueMesh.geometry.attributes.hasOwnProperty(attribute) && attribute !== 'color') {
        uniqueMesh.geometry.attributes[attribute].array = newArrayCopy;
        uniqueMesh.geometry.attributes[attribute].count = (newArray.length / itemSize);
        uniqueMesh.geometry.attributes[attribute].needsUpdate = true;
      }

      if (attribute === 'nodeIndex') {

        const auxOldArray = uniqueMesh.geometry.attributes.color.array;
        const auxNewArray = new Float32Array(auxOldArray.length + (3 * newValues.length));

        for (let x = 0; x < auxOldArray.length; x++) {

          auxNewArray[x] = auxOldArray[x];

        }

        for (let x = 0; x < newValues.length; x++) {

          const hexV = '0'.repeat(6 - newValues[x].toString(16).length) + newValues[x].toString(16);

          auxNewArray[auxOldArray.length + (x * 3)] = parseInt(hexV.substr(0, 2), 16) / 255;
          auxNewArray[auxOldArray.length + (x * 3) + 1] = parseInt(hexV.substr(2, 2), 16) / 255;
          auxNewArray[auxOldArray.length + (x * 3) + 2] = parseInt(hexV.substr(4, 2), 16) / 255;

        }

        uniqueMesh.geometry.attributes.color.array = auxNewArray;
        uniqueMesh.geometry.attributes.color.count = auxNewArray.length / 3;
        uniqueMesh.geometry.attributes.color.needsUpdate = true;

      }

    }

    mesh.geometry.maxInstancedCount += elements;
    uniqueMesh.geometry.maxInstancedCount += elements;

    // const newRadius = Math.sqrt(this.numElements * Math.PI * 4) * 20;
    //
    // this.nodesMaterial.uniforms.radius.value = newRadius;
    // this.uniqueNodesMaterial.uniforms.radius.value = newRadius;

    this.renderHoverScene();

  }

  private getNewValuesFor(attribute: string, elements: number, index: number): number[]
  {

    const ret: number[] = [];

    if (attribute === 'color') {
      for (let i = 0; i < elements; i++) {
        ret.push(Math.random());
        ret.push(Math.random());
        ret.push(Math.random());
      }
    } else if (attribute === 'size') {
      const halfSize = 12;
      for (let i = 0; i < elements; i++) {
        ret.push(Math.floor(Math.random() * halfSize) + halfSize);
      }
    } else if (attribute === 'nodeType') {
      for (let i = 0; i < elements; i++) {
        ret.push(index + 1);
      }
    } else if (attribute === 'offset') {
      for (let i = 0; i < elements; i++) {

        const newPosX = Math.random() - 0.5;
        const newPosY = Math.random() - 0.5;
        const newPosZ = Math.random() - 0.5;

        // noinspection JSSuspiciousNameCombination
        const magnitude = Math.sqrt(Math.pow(newPosX, 2) + Math.pow(newPosY, 2) + Math.pow(newPosZ, 2));

        const radius = Math.max(0.25, Math.random());

        ret.push((newPosX / magnitude) * radius);
        ret.push((newPosY / magnitude) * radius);
        ret.push((newPosZ / magnitude) * radius);
      }
    } else if (attribute === 'nodeIndex') {
      for (let i = 0; i < elements; i++) {
        const sizeAux = this.numElements;
        ret.push(parseInt('0'.repeat(6 - sizeAux.toString(16).length) + sizeAux.toString(16), 16));
        this.numElements++;
      }
    }

    return ret;

  }

  private animate(): void
  {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.render();
  }

  private render(): void
  {

    this.clockTime += this.clock.getDelta();
    if (!!this.nodesMaterial) {
      this.nodesMaterial.uniforms.time.value = this.clockTime;
      this.uniqueNodesMaterial.uniforms.time.value = this.clockTime;
    }

    if (this.renderingHoverScene){
      this.renderer.render(this.otherScene, this.camera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }

  }

  private renderHoverScene(): void
  {

    this.renderer.setRenderTarget(this.hoverTarget);
    this.renderer.render(this.otherScene, this.camera);
    this.renderer.setRenderTarget(null);

  }

  private onMouseMove(event: MouseEvent): void
  {

    if (this.materialsLoaded) {

      const mouse = {x: event.offsetX, y: (this.canvas.nativeElement.offsetHeight - event.offsetY)};

      const renderTargetPixelBuffer = new Uint8Array(4);
      this.renderer.readRenderTargetPixels(this.hoverTarget, mouse.x, mouse.y, 1, 1, renderTargetPixelBuffer);

      const color: [number, number, number] = [
        renderTargetPixelBuffer[0],
        renderTargetPixelBuffer[1],
        renderTargetPixelBuffer[2],
      ];

      const colorIndex = (color[0] * 65536) + (color[1] * 256) + (color[2]);

      this.nodesMaterial.uniforms.hoveredIndex.value = colorIndex;

      if (colorIndex > 0 && colorIndex < parseInt('ffffff', 16)) {
        this.htmlRenderer.setStyle(this.canvas.nativeElement, 'cursor', 'pointer');
      } else {
        this.htmlRenderer.setStyle(this.canvas.nativeElement, 'cursor', 'default');
      }

    }

  }

  private onWindowResize(): void
  {

    const width = this.wrapper.nativeElement.offsetWidth;
    const height = this.wrapper.nativeElement.offsetHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.controls.handleResize();

    this.hoverTarget = new WebGLRenderTarget(width, height);

    this.renderHoverScene();

  }

  public onToggleTheme(): void
  {

    this.darkTheme = !this.darkTheme;

    if (this.darkTheme) {
      this.scene.background = new Color(0x2b2b2b);
    } else {
      this.scene.background = new Color(0xf0f0f0);
    }

    if (this.materialsLoaded) {
      this.nodesMaterial.uniforms.dark.value = this.darkTheme ? 1 : 0;
    }

  }

  public onToggleMesh(index: number): void
  {

    if (index === 1) {
      this.showingOne = !this.showingOne;
    } else if (index === 2) {
      this.showingTwo = !this.showingTwo;
    }

    this.nodesMaterial.uniforms.showingOne.value = this.showingOne ? 1 : 0;
    this.uniqueNodesMaterial.uniforms.showingOne.value = this.showingOne ? 1 : 0;

    this.nodesMaterial.uniforms.showingTwo.value = this.showingTwo ? 1 : 0;
    this.uniqueNodesMaterial.uniforms.showingTwo.value = this.showingTwo ? 1 : 0;

  }

  public onToggleScene(): void
  {

    this.renderingHoverScene = !this.renderingHoverScene;

  }

  public onFigureChange(index: number): void
  {

    const newFigure = new (this.allForms[this.figuresIds[index]].buffer)(...this.allForms[this.figuresIds[index]].params);

    this.figureMeshes[index].geometry.index = newFigure.index;
    this.figureUniqueMeshes[index].geometry.index = newFigure.index;

    const attributes = Object.keys(newFigure.attributes);

    for (const att of attributes) {

      this.figureMeshes[index].geometry.attributes[att] = newFigure.attributes[att];
      this.figureUniqueMeshes[index].geometry.attributes[att] = newFigure.attributes[att];

    }

    this.renderHoverScene();

  }

  public filterElement(element: string, list: string[]): string[]
  {
    return list.filter(x => x !== element);
  }

}
