import { ObjectId } from 'mongodb';
import { database } from './config/database';
import { ProjectModel } from './models/ProjectModel';
import { ImageModel } from './models/ImageModel';
import { AnnotationModel } from './models/AnnotationModel';
import { CreateProjectRequest, CreateImageRequest, CreateAnnotationRequest } from './models/types';

const projectModel = new ProjectModel();
const imageModel = new ImageModel();
const annotationModel = new AnnotationModel();

async function seedDatabase(): Promise<void> {
  try {
    console.log('Starting database seeding...');

    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/perle_segmentation';
    const dbName = MONGODB_URI.split('/').pop() || 'perle_segmentation';
    await database.connect(MONGODB_URI, dbName);

    // Clear existing data (optional - uncomment if you want to start fresh)
    // await clearDatabase();

    // Create sample users (we'll use ObjectIds directly since we don't have user creation in this system)
    const adminUser = new ObjectId();
    const annotator1 = new ObjectId();
    const annotator2 = new ObjectId();
    const annotator3 = new ObjectId();

    console.log('Sample user IDs created');
    console.log(`   Admin: ${adminUser}`);
    console.log(`   Annotator 1: ${annotator1}`);
    console.log(`   Annotator 2: ${annotator2}`);
    console.log(`   Annotator 3: ${annotator3}`);

    // Create projects
    console.log('\nCreating projects...');
    
    const project1Data: CreateProjectRequest = {
      name: 'Wildlife Detection Project',
      description: 'Annotate animals in wildlife photos for conservation research',
      created_by: adminUser.toString(),
      annotators: [annotator1.toString(), annotator2.toString()]
    };

    const project2Data: CreateProjectRequest = {
      name: 'Medical Image Analysis',
      description: 'Segment anatomical structures in medical scans',
      created_by: adminUser.toString(),
      annotators: [annotator2.toString(), annotator3.toString()]
    };

    const project1 = await projectModel.create(project1Data);
    const project2 = await projectModel.create(project2Data);

    console.log(`   Created project: ${project1.name} (ID: ${project1._id})`);
    console.log(`   Created project: ${project2.name} (ID: ${project2._id})`);

    // Create images
    console.log('\nCreating images...');

    const image1Data: CreateImageRequest = {
      project_id: project1._id!.toString(),
      filename: 'forest_scene_001.jpg',
      url: 'https://example.com/images/forest_scene_001.jpg',
      width: 1920,
      height: 1080,
      format: 'jpg',
      file_size: 2456789
    };

    const image2Data: CreateImageRequest = {
      project_id: project1._id!.toString(),
      filename: 'savanna_animals_002.jpg',
      url: 'https://example.com/images/savanna_animals_002.jpg',
      width: 2560,
      height: 1440,
      format: 'jpg',
      file_size: 3789456
    };

    const image3Data: CreateImageRequest = {
      project_id: project2._id!.toString(),
      filename: 'brain_scan_003.png',
      url: 'https://example.com/images/brain_scan_003.png',
      width: 512,
      height: 512,
      format: 'png',
      file_size: 1234567
    };

    const image1 = await imageModel.create(image1Data);
    const image2 = await imageModel.create(image2Data);
    const image3 = await imageModel.create(image3Data);

    console.log(`   Created image: ${image1.filename} (ID: ${image1._id})`);
    console.log(`   Created image: ${image2.filename} (ID: ${image2._id})`);
    console.log(`   Created image: ${image3.filename} (ID: ${image3._id})`);

    // Create annotations for Image 1 (Forest Scene) - This will demonstrate area ranking
    console.log('\nCreating annotations for forest scene...');

    // Large tree annotation (300x400 = 120,000 pixels) - Should be rank 1
    const treeAnnotation: CreateAnnotationRequest = {
      image_id: image1._id!.toString(),
      project_id: project1._id!.toString(),
      annotator_id: annotator1.toString(),
      label: 'tree',
      mask: {
        format: 'polygon',
        data: {
          exterior: [[100, 100], [400, 100], [400, 500], [100, 500]]
        },
        width: 1920,
        height: 1080
      },
      confidence: 0.95,
      status: 'completed'
    };

    // Medium deer annotation (150x200 = 30,000 pixels) - Should be rank 2
    const deerAnnotation: CreateAnnotationRequest = {
      image_id: image1._id!.toString(),
      project_id: project1._id!.toString(),
      annotator_id: annotator2.toString(),
      label: 'deer',
      mask: {
        format: 'polygon',
        data: {
          exterior: [[800, 600], [950, 600], [950, 800], [800, 800]]
        },
        width: 1920,
        height: 1080
      },
      confidence: 0.87,
      status: 'completed'
    };

    // Small bird annotation (50x40 = 2,000 pixels) - Should be rank 3
    const birdAnnotation: CreateAnnotationRequest = {
      image_id: image1._id!.toString(),
      project_id: project1._id!.toString(),
      annotator_id: annotator1.toString(),
      label: 'bird',
      mask: {
        format: 'polygon',
        data: {
          exterior: [[1200, 300], [1250, 300], [1250, 340], [1200, 340]]
        },
        width: 1920,
        height: 1080
      },
      confidence: 0.72,
      status: 'completed'
    };

    // Tiny insect annotation using bitmap format (3x3 = 9 pixels) - Should be rank 4
    const insectAnnotation: CreateAnnotationRequest = {
      image_id: image1._id!.toString(),
      project_id: project1._id!.toString(),
      annotator_id: annotator2.toString(),
      label: 'insect',
      mask: {
        format: 'bitmap',
        data: {
          mask: [[1, 1, 1], [1, 0, 1], [1, 1, 1]]
        },
        width: 3,
        height: 3
      },
      confidence: 0.65,
      status: 'completed'
    };

    const tree = await annotationModel.create(treeAnnotation);
    const deer = await annotationModel.create(deerAnnotation);
    const bird = await annotationModel.create(birdAnnotation);
    const insect = await annotationModel.create(insectAnnotation);

    console.log(`   Tree annotation: ${tree.area} pixels (ID: ${tree._id})`);
    console.log(`   Deer annotation: ${deer.area} pixels (ID: ${deer._id})`);
    console.log(`   Bird annotation: ${bird.area} pixels (ID: ${bird._id})`);
    console.log(`   Insect annotation: ${insect.area} pixels (ID: ${insect._id})`);

    // Create annotations for Image 2 (Savanna Animals)
    console.log('\nCreating annotations for savanna scene...');

    // Large elephant using RLE format
    const elephantAnnotation: CreateAnnotationRequest = {
      image_id: image2._id!.toString(),
      project_id: project1._id!.toString(),
      annotator_id: annotator1.toString(),
      label: 'elephant',
      mask: {
        format: 'rle',
        data: {
          size: [1440, 2560],
          counts: '100,500,100,500,100,500,100' // This will calculate to 1500 pixels
        },
        width: 2560,
        height: 1440
      },
      confidence: 0.92,
      status: 'completed'
    };

    // Medium lion
    const lionAnnotation: CreateAnnotationRequest = {
      image_id: image2._id!.toString(),
      project_id: project1._id!.toString(),
      annotator_id: annotator2.toString(),
      label: 'lion',
      mask: {
        format: 'polygon',
        data: {
          exterior: [[1000, 800], [1200, 800], [1200, 1000], [1000, 1000]]
        },
        width: 2560,
        height: 1440
      },
      confidence: 0.88,
      status: 'completed'
    };

    const elephant = await annotationModel.create(elephantAnnotation);
    const lion = await annotationModel.create(lionAnnotation);

    console.log(`   Elephant annotation: ${elephant.area} pixels (ID: ${elephant._id})`);
    console.log(`   Lion annotation: ${lion.area} pixels (ID: ${lion._id})`);

    // Create annotations for Image 3 (Medical scan) - demonstrating different project
    console.log('\nCreating annotations for medical scan...');

    const brainAnnotation: CreateAnnotationRequest = {
      image_id: image3._id!.toString(),
      project_id: project2._id!.toString(),
      annotator_id: annotator3.toString(),
      label: 'brain_tissue',
      mask: {
        format: 'polygon',
        data: {
          exterior: [[100, 100], [400, 100], [400, 400], [100, 400]]
        },
        width: 512,
        height: 512
      },
      confidence: 0.94,
      status: 'completed'
    };

    const tumorAnnotation: CreateAnnotationRequest = {
      image_id: image3._id!.toString(),
      project_id: project2._id!.toString(),
      annotator_id: annotator2.toString(),
      label: 'tumor',
      mask: {
        format: 'polygon',
        data: {
          exterior: [[200, 200], [250, 200], [250, 250], [200, 250]]
        },
        width: 512,
        height: 512
      },
      confidence: 0.76,
      status: 'reviewed'
    };

    const brain = await annotationModel.create(brainAnnotation);
    const tumor = await annotationModel.create(tumorAnnotation);

    console.log(`   Brain tissue annotation: ${brain.area} pixels (ID: ${brain._id})`);
    console.log(`   Tumor annotation: ${tumor.area} pixels (ID: ${tumor._id})`);

    // Display summary
    console.log('\nSeeding Summary:');
    console.log(`   Projects created: 2`);
    console.log(`   Images created: 3`);
    console.log(`   Annotations created: 8`);
    console.log('\nTest the area ranking with these URLs:');
    console.log(`   Forest scene rankings: curl http://localhost:3000/api/images/${image1._id}/annotations/rankings`);
    console.log(`   Savanna scene rankings: curl http://localhost:3000/api/images/${image2._id}/annotations/rankings`);
    console.log(`   Medical scan rankings: curl http://localhost:3000/api/images/${image3._id}/annotations/rankings`);
    
    console.log('\nTest other endpoints:');
    console.log(`   All annotations: curl http://localhost:3000/api/annotations/`);
    console.log(`   All projects: curl http://localhost:3000/api/projects/`);
    console.log(`   Annotations by label: curl http://localhost:3000/api/annotations/by-label/tree`);
    console.log(`   Project progress: curl http://localhost:3000/api/projects/${project1._id}/progress`);

    console.log('\nDatabase seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await database.disconnect();
  }
}

async function clearDatabase(): Promise<void> {
  console.log('Clearing existing data...');
  const db = database.getDb();
  
  await db.collection('annotations').deleteMany({});
  await db.collection('images').deleteMany({});
  await db.collection('projects').deleteMany({});
  
  console.log('   Database cleared');
}

// Run the seed script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\nSeeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}