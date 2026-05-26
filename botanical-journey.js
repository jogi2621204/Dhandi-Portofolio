/* =============================================
   BOTANICAL JOURNEY — Three.js plant scene
   A living vine grows through the dark forest.
   Real 3D leaves, branches, rising seed particles.
   Scroll drives camera from roots up to canopy.
   ============================================= */
(function ()
{
    'use strict';

    const canvas = document.getElementById('journey-canvas');
    if (!canvas || typeof THREE === 'undefined' || typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x071a0b, 1);

    /* ── Scene & Camera ── */
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x071a0b, 0.017);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 16);

    /* ── Lighting — botanical forest palette ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.14));

    const topLight = new THREE.DirectionalLight(0xc7f9cc, 1.5);
    topLight.position.set(4, 10, 6);
    scene.add(topLight);

    const sideLight = new THREE.DirectionalLight(0x2d6a4f, 0.75);
    sideLight.position.set(-6, 2, -4);
    scene.add(sideLight);

    /* Warm soil glow from below — like sunlit earth */
    const groundLight = new THREE.PointLight(0xb5883a, 1.1, 24);
    groundLight.position.set(0, -6, 4);
    scene.add(groundLight);

    /* Soft canopy glow from above */
    const canopyLight = new THREE.PointLight(0x52b788, 0.9, 28);
    canopyLight.position.set(0, 9, 3);
    scene.add(canopyLight);

    /* ── Leaf shape — bezier leaf silhouette ── */
    function buildLeafShape(len, wid)
    {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.bezierCurveTo( wid * 0.72, len * 0.22,  wid * 0.62, len * 0.68, 0, len);
        s.bezierCurveTo(-wid * 0.62, len * 0.68, -wid * 0.72, len * 0.22, 0, 0);
        return s;
    }

    const leafColors = [0x1b4332, 0x2d6a4f, 0x40916c, 0x52b788, 0x74c69d, 0x1a5c3a];

    function makeLeaf(len, wid, colorHex)
    {
        const geo = new THREE.ShapeGeometry(buildLeafShape(len, wid), 12);
        const mat = new THREE.MeshStandardMaterial({
            color:             colorHex,
            emissive:          colorHex,
            emissiveIntensity: 0.18,
            side:              THREE.DoubleSide,
            transparent:       true,
            opacity:           0.80,
            roughness:         0.78,
            metalness:         0.02,
        });
        return new THREE.Mesh(geo, mat);
    }

    /* ── Vine/branch — CatmullRom tube ── */
    function makeVine(pts, radius, colorHex)
    {
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo   = new THREE.TubeGeometry(curve, 72, radius, 8, false);
        const mat   = new THREE.MeshStandardMaterial({
            color:             colorHex,
            emissive:          colorHex,
            emissiveIntensity: 0.12,
            roughness:         0.88,
            metalness:         0.04,
        });
        return new THREE.Mesh(geo, mat);
    }

    /* ── Leaf cluster helper ── */
    const allLeaves = [];

    function addLeaves(parent, cx, cy, cz, count, baseScale)
    {
        for (let i = 0; i < count; i++) {
            const ci   = Math.floor(Math.random() * leafColors.length);
            const len  = (0.65 + Math.random() * 0.85) * baseScale;
            const wid  = len * (0.34 + Math.random() * 0.22);
            const leaf = makeLeaf(len, wid, leafColors[ci]);

            leaf.position.set(
                cx + (Math.random() - 0.5) * 1.1,
                cy + (Math.random() - 0.5) * 0.7,
                cz + (Math.random() - 0.5) * 0.9
            );
            leaf.rotation.set(
                (Math.random() - 0.5) * Math.PI * 0.55,
                Math.random() * Math.PI * 2,
                (Math.random() - 0.5) * Math.PI * 0.38
            );

            leaf.userData.baseRx  = leaf.rotation.x;
            leaf.userData.baseRy  = leaf.rotation.y;
            leaf.userData.amp     = 0.035 + Math.random() * 0.055;
            leaf.userData.offset  = Math.random() * Math.PI * 2;
            leaf.userData.speed   = 0.28 + Math.random() * 0.42;

            parent.add(leaf);
            allLeaves.push(leaf);
        }
    }

    /* ── Small bud sphere at branch tips ── */
    function makeBud(x, y, z, r, colorHex)
    {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(r, 10, 10),
            new THREE.MeshStandardMaterial({
                color: colorHex, emissive: colorHex, emissiveIntensity: 0.35,
                roughness: 0.6, metalness: 0.05,
            })
        );
        mesh.position.set(x, y, z);
        return mesh;
    }

    /* ── Full plant group ── */
    const plantGroup = new THREE.Group();
    scene.add(plantGroup);

    /* Main trunk — gentle S-curve from soil floor to canopy */
    plantGroup.add(makeVine([
        new THREE.Vector3( 0.2, -9.2,  0.3),
        new THREE.Vector3(-0.4, -6.0,  0.2),
        new THREE.Vector3( 0.5, -3.0,  0.6),
        new THREE.Vector3(-0.3,  0.0, -0.2),
        new THREE.Vector3( 0.4,  3.2,  0.4),
        new THREE.Vector3(-0.2,  6.0, -0.1),
        new THREE.Vector3( 0.0,  9.2,  0.0),
    ], 0.058, 0x1b4332));

    /* ── Branch 1 — lower left ── */
    plantGroup.add(makeVine([
        new THREE.Vector3(-0.1, -3.5,  0.4),
        new THREE.Vector3(-1.6, -2.5,  1.0),
        new THREE.Vector3(-3.2, -1.8,  0.5),
        new THREE.Vector3(-4.6, -1.0, -0.1),
    ], 0.033, 0x2d6a4f));
    addLeaves(plantGroup, -4.6, -1.0, -0.1, 6, 1.1);
    addLeaves(plantGroup, -3.0, -2.2,  0.8, 4, 0.85);
    plantGroup.add(makeBud(-4.6, -0.8, -0.1, 0.14, 0x52b788));

    /* ── Branch 2 — right middle ── */
    plantGroup.add(makeVine([
        new THREE.Vector3( 0.3,  0.0, -0.1),
        new THREE.Vector3( 1.8,  0.9, -0.9),
        new THREE.Vector3( 3.6,  1.8, -0.4),
        new THREE.Vector3( 5.0,  2.6,  0.2),
    ], 0.030, 0x2d6a4f));
    addLeaves(plantGroup,  5.0,  2.6,  0.2, 7, 1.2);
    addLeaves(plantGroup,  3.2,  1.4, -0.9, 3, 0.78);
    plantGroup.add(makeBud( 5.0,  2.8,  0.2, 0.16, 0x74c69d));

    /* ── Branch 3 — upper left ── */
    plantGroup.add(makeVine([
        new THREE.Vector3(-0.2,  3.2,  0.3),
        new THREE.Vector3(-1.5,  4.3,  0.9),
        new THREE.Vector3(-3.0,  5.2,  0.3),
        new THREE.Vector3(-4.2,  6.0, -0.3),
    ], 0.024, 0x40916c));
    addLeaves(plantGroup, -4.2,  6.0, -0.3, 6, 1.0);
    addLeaves(plantGroup, -2.6,  4.6,  0.6, 3, 0.80);
    plantGroup.add(makeBud(-4.2,  6.2, -0.3, 0.12, 0x52b788));

    /* ── Branch 4 — upper right small ── */
    plantGroup.add(makeVine([
        new THREE.Vector3( 0.2,  5.6, -0.2),
        new THREE.Vector3( 1.6,  6.6, -0.6),
        new THREE.Vector3( 3.2,  7.4,  0.1),
        new THREE.Vector3( 4.0,  8.2,  0.5),
    ], 0.019, 0x40916c));
    addLeaves(plantGroup,  4.0,  8.2,  0.5, 5, 0.90);
    plantGroup.add(makeBud( 4.0,  8.4,  0.5, 0.10, 0x95d5b2));

    /* Leaves scattered along trunk at intervals */
    addLeaves(plantGroup,  0.1, -6.5,  0.3, 4, 0.68);
    addLeaves(plantGroup, -0.2, -1.5, -0.3, 5, 0.88);
    addLeaves(plantGroup,  0.2,  1.6,  0.3, 3, 0.72);
    addLeaves(plantGroup,  0.0,  6.8,  0.1, 4, 0.78);

    /* Dense crown at the top */
    addLeaves(plantGroup,  0.0,  9.2,  0.0, 9, 1.05);

    /* ── Hair-thin tendrils for organic detail ── */
    plantGroup.add(makeVine([
        new THREE.Vector3(-0.6, -2.2,  0.3),
        new THREE.Vector3(-0.9, -1.4,  0.9),
        new THREE.Vector3(-0.5, -0.6,  1.3),
        new THREE.Vector3(-0.1,  0.1,  1.1),
    ], 0.009, 0x52b788));

    plantGroup.add(makeVine([
        new THREE.Vector3( 0.5,  2.8, -0.1),
        new THREE.Vector3( 0.8,  3.7,  0.4),
        new THREE.Vector3( 0.4,  4.4,  0.7),
        new THREE.Vector3( 0.1,  5.0,  0.5),
    ], 0.007, 0x52b788));

    plantGroup.add(makeVine([
        new THREE.Vector3(-0.3,  6.8,  0.2),
        new THREE.Vector3(-0.7,  7.5,  0.6),
        new THREE.Vector3(-0.4,  8.1,  0.9),
    ], 0.007, 0x74c69d));

    /* ── Rising seed particles — golden pollen drifting upward ── */
    const SEED_N   = 520;
    const seedPos  = new Float32Array(SEED_N * 3);
    const seedSpd  = new Float32Array(SEED_N);
    const seedOff  = new Float32Array(SEED_N);

    for (let i = 0; i < SEED_N; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.8 + Math.random() * 9.5;
        seedPos[i * 3]     = Math.cos(a) * r;
        seedPos[i * 3 + 1] = -10 + Math.random() * 22;
        seedPos[i * 3 + 2] = Math.sin(a) * r;
        seedSpd[i] = 0.004 + Math.random() * 0.011;
        seedOff[i] = Math.random() * Math.PI * 2;
    }

    const seedGeo  = new THREE.BufferGeometry();
    const seedAttr = new THREE.BufferAttribute(seedPos, 3);
    seedAttr.setUsage(THREE.DynamicDrawUsage);
    seedGeo.setAttribute('position', seedAttr);

    scene.add(new THREE.Points(seedGeo,
        new THREE.PointsMaterial({
            color: 0xb5883a, size: 0.042, transparent: true, opacity: 0.58, sizeAttenuation: true,
        })
    ));

    /* ── Static mist — tiny green dust in air ── */
    {
        const N   = 280;
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 7 + Math.random() * 18;
            pos[i * 3]     = Math.cos(a) * r;
            pos[i * 3 + 1] = -8 + Math.random() * 18;
            pos[i * 3 + 2] = Math.sin(a) * r;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        scene.add(new THREE.Points(g,
            new THREE.PointsMaterial({
                color: 0x52b788, size: 0.028, transparent: true, opacity: 0.20, sizeAttenuation: true,
            })
        ));
    }

    /* ── Camera waypoints — journey from soil to canopy ── */
    const waypoints = [
        { x:  0.0, y:  0.0, z: 16.0, rx:  0.00, ry:  0.00 }, // 0  Hero       — whole plant in view
        { x: -0.5, y: -4.0, z:  7.5, rx:  0.22, ry:  0.10 }, // 1  About      — near the roots
        { x:  2.4, y: -1.2, z:  8.0, rx: -0.12, ry: -0.30 }, // 2  Education  — mid trunk, branch 1
        { x: -1.4, y:  1.4, z:  6.5, rx:  0.16, ry:  0.26 }, // 3  Experience — branch 2 territory
        { x:  1.6, y:  3.5, z:  6.2, rx: -0.24, ry: -0.20 }, // 4  Leadership — upper canopy
        { x: -0.6, y:  6.2, z:  5.5, rx:  0.35, ry:  0.10 }, // 5  Committee  — deep in crown
        { x:  0.0, y:  0.0, z: 22.0, rx:  0.00, ry:  0.00 }, // 6  Contact    — pull all the way back
    ];

    const cam = { x: 0, y: 0, z: 16 };
    const scn = { rx: 0, ry: 0 };

    /* ── ScrollTrigger timeline ── */
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#journey',
            start:   'top top',
            end:     'bottom bottom',
            scrub:   2.5,
        },
    });

    waypoints.slice(1).forEach((wp, i) =>
    {
        tl
            .to(cam, { x: wp.x, y: wp.y, z: wp.z, ease: 'power2.inOut', duration: 1 }, i)
            .to(scn, { rx: wp.rx, ry: wp.ry,       ease: 'power2.inOut', duration: 1 }, i);
    });

    /* ── Chapter panel fade in / out ── */
    document.querySelectorAll('.chapter').forEach((ch) =>
    {
        const panel = ch.querySelector('.ch-panel');
        if (!panel) return;

        gsap.set(panel, { opacity: 0, y: 28 });

        ScrollTrigger.create({
            trigger:     ch,
            start:       'top 62%',
            end:         'bottom 38%',
            onEnter:     () => gsap.to(panel, { opacity: 1, y: 0,   duration: 0.65, ease: 'power2.out' }),
            onLeave:     () => gsap.to(panel, { opacity: 0, y: -20, duration: 0.42 }),
            onEnterBack: () => gsap.to(panel, { opacity: 1, y: 0,   duration: 0.65, ease: 'power2.out' }),
            onLeaveBack: () => gsap.to(panel, { opacity: 0, y: 20,  duration: 0.42 }),
        });
    });

    /* ── Hero text fade as user scrolls away ── */
    const heroText = document.getElementById('hero-text');

    ScrollTrigger.create({
        trigger: '#ch-hero',
        start:   'top top',
        end:     'bottom top',
        onUpdate: (self) =>
        {
            const p = self.progress;
            if (heroText) gsap.set(heroText, { opacity: Math.max(0, 1 - p * 2.4), y: -p * 52 });
        },
    });

    /* ── Progress dots ── */
    const dots = document.querySelectorAll('.j-dot');

    if (dots.length) {
        ScrollTrigger.create({
            trigger: '#journey',
            start:   'top top',
            end:     'bottom bottom',
            onUpdate: (self) =>
            {
                const idx = Math.min(waypoints.length - 1, Math.round(self.progress * (waypoints.length - 1)));
                dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            },
        });

        dots.forEach((dot) =>
        {
            dot.addEventListener('click', () =>
            {
                const target = dot.dataset.target;
                if (target) document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    /* ── Mouse parallax ── */
    let mx = 0, my = 0, cmx = 0, cmy = 0;

    window.addEventListener('mousemove', (e) =>
    {
        mx = (e.clientX / window.innerWidth  - 0.5) * 0.28;
        my = (e.clientY / window.innerHeight - 0.5) * 0.18;
    }, { passive: true });

    /* ── Animation loop ── */
    let t = 0;

    function animate()
    {
        requestAnimationFrame(animate);
        t += 0.016;

        /* Mouse lag smoothing */
        cmx += (mx - cmx) * 0.028;
        cmy += (my - cmy) * 0.028;

        /* Apply GSAP camera state + parallax */
        camera.position.set(cam.x + cmx * 0.45, cam.y - cmy * 0.32, cam.z);
        scene.rotation.set(scn.rx + cmy * 0.040, scn.ry + cmx * 0.040, 0);

        /* Leaf sway — individual breeze per leaf */
        allLeaves.forEach((leaf) =>
        {
            leaf.rotation.x = leaf.userData.baseRx + Math.sin(t * leaf.userData.speed + leaf.userData.offset) * leaf.userData.amp;
            leaf.rotation.y = leaf.userData.baseRy + Math.cos(t * leaf.userData.speed * 0.65 + leaf.userData.offset) * leaf.userData.amp * 0.55;
        });

        /* Rising seed particles — float upward, loop at top */
        for (let i = 0; i < SEED_N; i++) {
            seedPos[i * 3 + 1] += seedSpd[i];
            seedPos[i * 3]     += Math.sin(t * 0.38 + seedOff[i]) * 0.0008;

            if (seedPos[i * 3 + 1] > 11) {
                const a = Math.random() * Math.PI * 2;
                const r = 0.8 + Math.random() * 9.5;
                seedPos[i * 3]     = Math.cos(a) * r;
                seedPos[i * 3 + 1] = -10;
                seedPos[i * 3 + 2] = Math.sin(a) * r;
            }
        }
        seedAttr.needsUpdate = true;

        /* Whole plant breathes slowly */
        plantGroup.rotation.z = Math.sin(t * 0.16) * 0.016;
        plantGroup.rotation.x = Math.sin(t * 0.10 + 0.8) * 0.009;

        /* Light pulse — forest breathing */
        groundLight.intensity = 0.75 + 0.38 * Math.sin(t * 0.48);
        canopyLight.intensity = 0.65 + 0.28 * Math.sin(t * 0.36 + 1.4);

        renderer.render(scene, camera);
    }

    animate();

    /* ── Resize ── */
    window.addEventListener('resize', () =>
    {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ── Pause on hidden tab ── */
    document.addEventListener('visibilitychange', () =>
    {
        if (document.hidden) cancelAnimationFrame(animate);
        else animate();
    });
})();
